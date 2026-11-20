import mongoose from 'mongoose';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import PlacementDrive from '../models/PlacementDrive.js';
import Company from '../models/Company.js';
import Application from '../models/Application.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import Notification from '../models/Notification.js';
import { checkEligibility } from './eligibilityService.js';
import { calculateProfileCompletion } from '../controllers/userController.js';

/**
 * Escapes regex special characters to prevent invalid regular expression errors
 */
export const escapeRegExp = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Standard department normalizer
 */
const normalizeDept = (dept) => {
  if (!dept) return '';
  const d = String(dept).trim().toLowerCase();
  if (d === 'cse' || d.includes('computer')) return 'Computer Science';
  if (d === 'it' || d.includes('information')) return 'Information Technology';
  if (d === 'ece' || d.includes('electronics')) return 'Electronics & Communication';
  if (d === 'eee' || d.includes('electrical')) return 'Electrical Engineering';
  if (d === 'mech' || d.includes('mechanical')) return 'Mechanical Engineering';
  if (d === 'civil' || d.includes('civil')) return 'Civil Engineering';
  return dept;
};

// 1. Intelligent Student Search
export const searchStudents = async (params = {}) => {
  const {
    query = '',
    cgpaMin,
    cgpaMax,
    department,
    batch,
    skills = [],
    hasResume,
    hasBacklogs,
    minProjects,
    backlogsMax,
    placementStatus,
    limit = 25,
    page = 1,
  } = params;

  const profileFilter = {};

  if (department && department !== 'All') {
    const norm = normalizeDept(department);
    profileFilter.department = { $regex: new RegExp(escapeRegExp(norm), 'i') };
  }

  if (batch) {
    profileFilter.batch = Number(batch);
  }

  if (cgpaMin !== undefined && cgpaMin !== null && !isNaN(cgpaMin)) {
    profileFilter.cgpa = { ...(profileFilter.cgpa || {}), $gte: Number(cgpaMin) };
  }

  if (cgpaMax !== undefined && cgpaMax !== null && !isNaN(cgpaMax)) {
    profileFilter.cgpa = { ...(profileFilter.cgpa || {}), $lte: Number(cgpaMax) };
  }

  if (hasBacklogs === true) {
    profileFilter.activeBacklogs = { $gt: 0 };
  } else if (hasBacklogs === false) {
    profileFilter.activeBacklogs = 0;
  } else if (backlogsMax !== undefined && backlogsMax !== null && !isNaN(backlogsMax)) {
    profileFilter.activeBacklogs = { $lte: Number(backlogsMax) };
  }

  if (hasResume === true) {
    profileFilter.resumeUrl = { $exists: true, $ne: '' };
  } else if (hasResume === false) {
    profileFilter.$or = [{ resumeUrl: { $exists: false } }, { resumeUrl: '' }, { resumeUrl: null }];
  }

  if (placementStatus && placementStatus !== 'All') {
    profileFilter.placementStatus = placementStatus;
  }

  // Handle skill filter (checks StudentProfile skills array)
  if (Array.isArray(skills) && skills.length > 0) {
    profileFilter.skills = {
      $all: skills.map((s) => new RegExp(escapeRegExp(s.trim()), 'i')),
    };
  } else if (typeof skills === 'string' && skills.trim().length > 0) {
    profileFilter.skills = { $regex: new RegExp(escapeRegExp(skills.trim()), 'i') };
  }

  // Text search on User name / email or rollNumber
  let userIds = null;
  if (query && query.trim()) {
    const qRegex = new RegExp(escapeRegExp(query.trim()), 'i');
    const matchedUsers = await User.find({
      role: 'student',
      $or: [{ name: qRegex }, { email: qRegex }],
    }).select('_id');

    userIds = matchedUsers.map((u) => u._id);
    profileFilter.$or = [
      { user: { $in: userIds } },
      { rollNumber: qRegex },
      { skills: { $in: [qRegex] } },
    ];
  }

  const skip = (Math.max(1, page) - 1) * limit;

  // Retrieve matching profiles
  let profiles = await StudentProfile.find(profileFilter)
    .populate('user', 'name email profilePhoto isActive')
    .sort({ cgpa: -1, rollNumber: 1 })
    .lean();

  // If minProjects is requested, cross-reference with ResumeAnalysis
  if (minProjects !== undefined && minProjects !== null && Number(minProjects) > 0) {
    const minP = Number(minProjects);
    const analyses = await ResumeAnalysis.find({
      projects: { $exists: true, $not: { $size: 0 } },
    })
      .select('student projects')
      .lean();

    const qualifiedStudentIds = new Set(
      analyses.filter((a) => a.projects && a.projects.length >= minP).map((a) => a.student.toString())
    );

    profiles = profiles.filter((p) => p.user && qualifiedStudentIds.has(p.user._id.toString()));
  }

  const totalCount = profiles.length;
  const paginatedProfiles = profiles.slice(skip, skip + limit);

  // Map to structured, secure output
  const studentResults = paginatedProfiles.map((p) => {
    const userObj = p.user || {};
    const completion = calculateProfileCompletion(userObj, p);

    return {
      id: userObj._id || p._id,
      profileId: p._id,
      name: userObj.name || 'Unknown Candidate',
      email: userObj.email || '',
      rollNumber: p.rollNumber || 'N/A',
      department: p.department || 'General',
      batch: p.batch || 2026,
      cgpa: p.cgpa || 0,
      activeBacklogs: p.activeBacklogs || 0,
      skills: Array.isArray(p.skills) ? p.skills : [],
      hasResume: Boolean(p.resumeUrl && p.resumeUrl.trim().length > 0),
      resumeOriginalName: p.resumeOriginalName || 'Resume.pdf',
      resumeUrl: p.resumeUrl || '',
      placementStatus: p.placementStatus || 'Not Placed',
      profileCompletion: completion.percentage,
    };
  });

  return {
    total: totalCount,
    page,
    limit,
    students: studentResults,
    filtersApplied: {
      query,
      cgpaMin,
      cgpaMax,
      department,
      batch,
      skills,
      hasResume,
      minProjects,
      backlogsMax,
      placementStatus,
    },
  };
};

// 2. Get Comprehensive Student Details
export const getStudentDetails = async (params = {}) => {
  const { studentId, rollNumber, email } = params;

  let profile = null;

  if (studentId && mongoose.isValidObjectId(studentId)) {
    profile = await StudentProfile.findOne({
      $or: [{ user: studentId }, { _id: studentId }],
    }).populate('user', 'name email profilePhoto role');
  } else if (rollNumber) {
    profile = await StudentProfile.findOne({
      rollNumber: rollNumber.trim().toUpperCase(),
    }).populate('user', 'name email profilePhoto role');
  } else if (email) {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (user) {
      profile = await StudentProfile.findOne({ user: user._id }).populate('user');
    }
  }

  if (!profile) {
    return { error: 'Student not found matching the specified identification.' };
  }

  const userId = profile.user?._id;

  // Retrieve resume analysis if available
  const analysis = await ResumeAnalysis.findOne({ student: userId })
    .sort({ updatedAt: -1 })
    .lean();

  // Retrieve applications history
  const applications = await Application.find({ student: userId })
    .populate('company', 'name industry')
    .populate('drive', 'title jobRole packageLPA status')
    .sort({ appliedAt: -1 })
    .lean();

  const completion = calculateProfileCompletion(profile.user || {}, profile);

  return {
    student: {
      id: userId,
      profileId: profile._id,
      name: profile.user?.name || '',
      email: profile.user?.email || '',
      rollNumber: profile.rollNumber,
      department: profile.department,
      batch: profile.batch,
      cgpa: profile.cgpa,
      activeBacklogs: profile.activeBacklogs || 0,
      totalBacklogs: profile.totalBacklogs || 0,
      tenthPercentage: profile.tenthPercentage || 0,
      twelfthPercentage: profile.twelfthPercentage || 0,
      phone: profile.phone || '',
      skills: profile.skills || [],
      githubUrl: profile.githubUrl || '',
      linkedinUrl: profile.linkedinUrl || '',
      hasResume: Boolean(profile.resumeUrl),
      resumeOriginalName: profile.resumeOriginalName || 'Resume.pdf',
      resumeUrl: profile.resumeUrl || '',
      placementStatus: profile.placementStatus || 'Not Placed',
      profileCompletion: completion.percentage,
    },
    resumeAnalysis: analysis
      ? {
          overallScore: analysis.overallScore,
          extractedSkills: analysis.extractedSkills,
          projectsCount: analysis.projects?.length || 0,
          projects: analysis.projects || [],
          experience: analysis.experience || [],
          certifications: analysis.certifications || [],
        }
      : null,
    applicationsSummary: {
      total: applications.length,
      history: applications.map((a) => ({
        id: a._id,
        company: a.company?.name || 'Company',
        role: a.drive?.jobRole || 'Role',
        status: a.status,
        appliedAt: a.appliedAt,
      })),
    },
  };
};

// 3. Placement Drive Eligibility Evaluation
export const getStudentEligibility = async (params = {}) => {
  const {
    driveId,
    driveName,
    companyName,
    department,
    cgpaMin,
    hasResume,
    minProjects,
    limit = 30,
    page = 1,
  } = params;

  let drive = null;

  if (driveId && mongoose.isValidObjectId(driveId)) {
    drive = await PlacementDrive.findById(driveId).populate('company');
  } else if (driveName || companyName) {
    const qName = driveName || companyName;
    const regex = new RegExp(escapeRegExp(qName.trim()), 'i');

    const matchedCompanies = await Company.find({ name: regex }).select('_id');
    const compIds = matchedCompanies.map((c) => c._id);

    drive = await PlacementDrive.findOne({
      $or: [
        { title: regex },
        { jobRole: regex },
        { company: { $in: compIds } },
      ],
    })
      .populate('company')
      .sort({ createdAt: -1 });
  }

  if (!drive) {
    // If not found, fall back to the most recent published drive
    drive = await PlacementDrive.findOne({ status: { $in: ['Published', 'Upcoming', 'Ongoing'] } })
      .populate('company')
      .sort({ createdAt: -1 });
  }

  if (!drive) {
    return { error: 'No placement drive found in the system to evaluate eligibility against.' };
  }

  // Query all active student profiles
  const profileQuery = {};
  if (department && department !== 'All') {
    const norm = normalizeDept(department);
    profileQuery.department = { $regex: new RegExp(escapeRegExp(norm), 'i') };
  }

  const profiles = await StudentProfile.find(profileQuery)
    .populate('user', 'name email isActive')
    .lean();

  // If minProjects requested, get resume analyses
  let qualifiedStudentIds = null;
  if (minProjects !== undefined && minProjects !== null && Number(minProjects) > 0) {
    const minP = Number(minProjects);
    const analyses = await ResumeAnalysis.find({
      projects: { $exists: true, $not: { $size: 0 } },
    })
      .select('student projects')
      .lean();

    qualifiedStudentIds = new Set(
      analyses.filter((a) => a.projects && a.projects.length >= minP).map((a) => a.student.toString())
    );
  }

  const eligibleList = [];
  const ineligibleList = [];

  for (const p of profiles) {
    if (!p.user || !p.user.isActive) continue;

    const evaluation = checkEligibility(p, drive);

    // Apply extra user requested constraints
    let passedExtra = true;
    const extraReasons = [];

    if (cgpaMin && p.cgpa < Number(cgpaMin)) {
      passedExtra = false;
      extraReasons.push(`CGPA ${p.cgpa} is below requested filter minimum ${cgpaMin}`);
    }

    if (hasResume === true && (!p.resumeUrl || p.resumeUrl.trim().length === 0)) {
      passedExtra = false;
      extraReasons.push('Resume document has not been uploaded yet');
    }

    if (qualifiedStudentIds && !qualifiedStudentIds.has(p.user._id.toString())) {
      passedExtra = false;
      extraReasons.push(`Does not have at least ${minProjects} project(s) recorded in resume`);
    }

    const studentSummary = {
      id: p.user._id,
      profileId: p._id,
      name: p.user.name,
      email: p.user.email,
      rollNumber: p.rollNumber,
      department: p.department,
      batch: p.batch,
      cgpa: p.cgpa,
      activeBacklogs: p.activeBacklogs || 0,
      skills: p.skills || [],
      hasResume: Boolean(p.resumeUrl),
      resumeOriginalName: p.resumeOriginalName || 'Resume.pdf',
    };

    if (evaluation.isEligible && passedExtra) {
      eligibleList.push({
        ...studentSummary,
        eligibilityStatus: 'Eligible',
      });
    } else {
      ineligibleList.push({
        ...studentSummary,
        eligibilityStatus: 'Ineligible',
        reasons: [...evaluation.reasons, ...extraReasons],
      });
    }
  }

  // Sort eligible candidates by CGPA descending
  eligibleList.sort((a, b) => b.cgpa - a.cgpa);

  const skip = (Math.max(1, page) - 1) * limit;
  const paginatedEligible = eligibleList.slice(skip, skip + limit);

  return {
    drive: {
      id: drive._id,
      title: drive.title,
      company: drive.company?.name || 'Company',
      jobRole: drive.jobRole,
      packageLPA: drive.packageLPA,
      status: drive.status,
      deadline: drive.applicationClosingDate,
      eligibilityCriteria: drive.eligibilityCriteria,
    },
    totalStudentsEvaluated: profiles.length,
    eligibleCount: eligibleList.length,
    ineligibleCount: ineligibleList.length,
    students: paginatedEligible,
    page,
    limit,
    filtersApplied: {
      driveId: drive._id,
      driveTitle: drive.title,
      department,
      cgpaMin,
      hasResume,
      minProjects,
    },
    criteriaSummary: `Min CGPA: ${drive.eligibilityCriteria?.minCgpa || 6.0}, Allowed Depts: ${(drive.eligibilityCriteria?.allowedDepartments || []).join(', ') || 'All'}, Max Backlogs: ${drive.eligibilityCriteria?.maxActiveBacklogs ?? 0}`,
  };
};

// 4. Placement Drives Intelligence
export const getPlacementDrives = async (params = {}) => {
  const {
    status = 'All',
    closingWithinDays,
    department,
    company,
    jobRole,
    minPackage,
    limit = 20,
  } = params;

  const filter = {};

  if (status && status !== 'All') {
    filter.status = status;
  }

  if (minPackage) {
    filter.packageLPA = { $gte: Number(minPackage) };
  }

  if (department && department !== 'All') {
    const norm = normalizeDept(department);
    filter['eligibilityCriteria.allowedDepartments'] = { $regex: new RegExp(escapeRegExp(norm), 'i') };
  }

  if (jobRole && jobRole !== 'All') {
    filter.jobRole = { $regex: new RegExp(escapeRegExp(jobRole.trim()), 'i') };
  }

  if (closingWithinDays !== undefined && closingWithinDays !== null) {
    const days = Number(closingWithinDays);
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    filter.applicationClosingDate = { $gte: now, $lte: future };
  }

  let drives = await PlacementDrive.find(filter)
    .populate('company', 'name industry location logoUrl')
    .sort({ applicationClosingDate: 1, createdAt: -1 })
    .limit(limit)
    .lean();

  if (company && company !== 'All') {
    const cRegex = new RegExp(escapeRegExp(company.trim()), 'i');
    drives = drives.filter((d) => d.company?.name && cRegex.test(d.company.name));
  }

  // Compute applicants count for each drive
  const driveIds = drives.map((d) => d._id);
  const applicantCounts = await Application.aggregate([
    { $match: { drive: { $in: driveIds } } },
    { $group: { _id: '$drive', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  for (const a of applicantCounts) {
    countMap[a._id.toString()] = a.count;
  }

  const enrichedDrives = drives.map((d) => {
    const deadline = d.applicationClosingDate ? new Date(d.applicationClosingDate) : null;
    const now = new Date();
    const daysRemaining = deadline
      ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: d._id,
      title: d.title,
      company: d.company?.name || 'Company',
      companyIndustry: d.company?.industry || 'Technology',
      jobRole: d.jobRole,
      packageLPA: d.packageLPA,
      vacancies: d.vacancies || 5,
      location: d.location || 'Flexible',
      status: d.status,
      requiredSkills: d.requiredSkills || [],
      minCgpa: d.eligibilityCriteria?.minCgpa || 6.0,
      allowedDepartments: d.eligibilityCriteria?.allowedDepartments || [],
      deadline: d.applicationClosingDate,
      daysRemaining,
      applicantsCount: countMap[d._id.toString()] || 0,
    };
  });

  return {
    total: enrichedDrives.length,
    drives: enrichedDrives,
  };
};

// 5. Drive Details & Applicant Summary
export const getDriveDetails = async (params = {}) => {
  const { driveId, companyName, jobRole } = params;

  let drive = null;

  if (driveId && mongoose.isValidObjectId(driveId)) {
    drive = await PlacementDrive.findById(driveId).populate('company');
  } else if (companyName || jobRole) {
    const qName = companyName || jobRole;
    const regex = new RegExp(escapeRegExp(qName.trim()), 'i');
    const matchedComps = await Company.find({ name: regex }).select('_id');
    const compIds = matchedComps.map((c) => c._id);

    drive = await PlacementDrive.findOne({
      $or: [{ title: regex }, { jobRole: regex }, { company: { $in: compIds } }],
    }).populate('company');
  }

  if (!drive) {
    return { error: 'Placement drive could not be located in the database.' };
  }

  // Application statistics breakdown for this drive
  const appStats = await Application.aggregate([
    { $match: { drive: drive._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusBreakdown = {
    total: 0,
    Applied: 0,
    'Under Review': 0,
    Shortlisted: 0,
    Interviewing: 0,
    Selected: 0,
    Rejected: 0,
  };

  for (const s of appStats) {
    statusBreakdown[s._id] = s.count;
    statusBreakdown.total += s.count;
  }

  return {
    drive: {
      id: drive._id,
      title: drive.title,
      company: drive.company?.name || 'Company',
      companyWebsite: drive.company?.website || '',
      jobRole: drive.jobRole,
      jobDescription: drive.jobDescription || drive.description || '',
      packageLPA: drive.packageLPA,
      location: drive.location,
      vacancies: drive.vacancies,
      employmentType: drive.employmentType,
      status: drive.status,
      requiredSkills: drive.requiredSkills || [],
      eligibilityCriteria: drive.eligibilityCriteria,
      deadline: drive.applicationClosingDate,
    },
    statusBreakdown,
  };
};

// 6. Drive Applicants List
export const getDriveApplicants = async (params = {}) => {
  const { driveId, companyName, status, search, limit = 25, page = 1 } = params;

  let targetDriveId = driveId;

  if (!targetDriveId || !mongoose.isValidObjectId(targetDriveId)) {
    if (companyName) {
      const comp = await Company.findOne({ name: new RegExp(escapeRegExp(companyName.trim()), 'i') });
      if (comp) {
        const drive = await PlacementDrive.findOne({ company: comp._id }).sort({ createdAt: -1 });
        if (drive) targetDriveId = drive._id;
      }
    }
  }

  if (!targetDriveId) {
    const recentDrive = await PlacementDrive.findOne().sort({ createdAt: -1 });
    if (recentDrive) targetDriveId = recentDrive._id;
  }

  if (!targetDriveId) {
    return { error: 'No placement drive specified or found.' };
  }

  const appFilter = { drive: targetDriveId };
  if (status && status !== 'All') {
    appFilter.status = status;
  }

  const applications = await Application.find(appFilter)
    .populate('student', 'name email profilePhoto')
    .populate('company', 'name')
    .populate('drive', 'title jobRole packageLPA')
    .populate('studentProfile', 'rollNumber department batch cgpa phone resumeUrl')
    .sort({ appliedAt: -1 })
    .lean();

  let filtered = applications;

  if (search && search.trim()) {
    const sRegex = new RegExp(escapeRegExp(search.trim()), 'i');
    filtered = filtered.filter(
      (a) =>
        sRegex.test(a.student?.name || '') ||
        sRegex.test(a.studentProfile?.rollNumber || '') ||
        sRegex.test(a.studentProfile?.department || '')
    );
  }

  const total = filtered.length;
  const skip = (Math.max(1, page) - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  return {
    driveId: targetDriveId,
    total,
    page,
    limit,
    applicants: paginated.map((a) => ({
      applicationId: a._id,
      studentId: a.student?._id,
      name: a.student?.name || 'Candidate',
      email: a.student?.email || '',
      rollNumber: a.studentProfile?.rollNumber || a.resumeSnapshot?.studentRollNumber || 'N/A',
      department: a.studentProfile?.department || a.resumeSnapshot?.studentDepartment || 'General',
      cgpa: a.studentProfile?.cgpa ?? a.resumeSnapshot?.studentCgpa ?? 0,
      status: a.status,
      currentRound: a.currentRound || 1,
      appliedAt: a.appliedAt,
      hasResume: Boolean(a.studentProfile?.resumeUrl || a.resumeSnapshot?.resumeUrl),
      resumeUrl: a.studentProfile?.resumeUrl || a.resumeSnapshot?.resumeUrl || '',
    })),
  };
};

// 7. Application & Recruitment Statistics
export const getApplicationStatistics = async (params = {}) => {
  const { timeframe = 'all', company, driveId } = params;

  const match = {};

  if (driveId && mongoose.isValidObjectId(driveId)) {
    match.drive = new mongoose.Types.ObjectId(driveId);
  }

  if (timeframe === 'month' || timeframe === 'this-month') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    match.appliedAt = { $gte: startOfMonth };
  }

  const statusAgg = await Application.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const stats = {
    totalApplications: 0,
    applied: 0,
    underReview: 0,
    shortlisted: 0,
    interviewing: 0,
    selected: 0,
    rejected: 0,
  };

  for (const s of statusAgg) {
    stats.totalApplications += s.count;
    if (s._id === 'Applied') stats.applied = s.count;
    if (s._id === 'Under Review') stats.underReview = s.count;
    if (s._id === 'Shortlisted') stats.shortlisted = s.count;
    if (s._id === 'Interviewing') stats.interviewing = s.count;
    if (s._id === 'Selected') stats.selected = s.count;
    if (s._id === 'Rejected') stats.rejected = s.count;
  }

  stats.selectionRate =
    stats.totalApplications > 0
      ? `${((stats.selected / stats.totalApplications) * 100).toFixed(1)}%`
      : '0.0%';

  stats.reviewPending = stats.applied + stats.underReview;

  return stats;
};

// 8. Overall Selection Statistics & Placement Progress
export const getSelectionStatistics = async (params = {}) => {
  const totalStudents = await StudentProfile.countDocuments();
  const placedStudents = await StudentProfile.countDocuments({ placementStatus: 'Placed' });

  // Department-wise breakdown
  const deptBreakdown = await StudentProfile.aggregate([
    {
      $group: {
        _id: '$department',
        total: { $sum: 1 },
        placed: {
          $sum: { $cond: [{ $eq: ['$placementStatus', 'Placed'] }, 1, 0] },
        },
        avgCgpa: { $avg: '$cgpa' },
      },
    },
  ]);

  // Packages summary
  const packagesAgg = await PlacementDrive.aggregate([
    { $match: { packageLPA: { $gt: 0 } } },
    {
      $group: {
        _id: null,
        highestPackage: { $max: '$packageLPA' },
        averagePackage: { $avg: '$packageLPA' },
        drivesCount: { $sum: 1 },
      },
    },
  ]);

  const highest = packagesAgg[0]?.highestPackage || 0;
  const avg = packagesAgg[0]?.averagePackage ? Number(packagesAgg[0].averagePackage.toFixed(2)) : 0;

  return {
    totalStudents,
    placedStudents,
    unplacedStudents: Math.max(0, totalStudents - placedStudents),
    placementPercentage:
      totalStudents > 0 ? `${((placedStudents / totalStudents) * 100).toFixed(1)}%` : '0.0%',
    highestPackageLPA: highest,
    averagePackageLPA: avg,
    departmentBreakdown: deptBreakdown.map((d) => ({
      department: d._id || 'General',
      total: d.total,
      placed: d.placed,
      percentage: d.total > 0 ? `${((d.placed / d.total) * 100).toFixed(1)}%` : '0%',
      avgCgpa: Number((d.avgCgpa || 0).toFixed(2)),
    })),
  };
};

// 9. Upcoming Deadlines (closing within N days)
export const getUpcomingDeadlines = async (params = {}) => {
  const { days = 7 } = params;
  return await getPlacementDrives({
    status: 'Published',
    closingWithinDays: days,
    limit: 15,
  });
};

// 10. Identify Missing Resumes
export const getMissingResumes = async (params = {}) => {
  const { department, batch, limit = 50 } = params;

  return await searchStudents({
    department,
    batch,
    hasResume: false,
    limit,
  });
};

// 11. Pending Review Applications
export const getPendingApplications = async (params = {}) => {
  const { driveId, limit = 30 } = params;

  const appFilter = { status: { $in: ['Applied', 'Under Review'] } };
  if (driveId && mongoose.isValidObjectId(driveId)) {
    appFilter.drive = driveId;
  }

  const pendingApps = await Application.find(appFilter)
    .populate('student', 'name email profilePhoto')
    .populate('company', 'name')
    .populate('drive', 'title jobRole packageLPA')
    .populate('studentProfile', 'rollNumber department cgpa')
    .sort({ appliedAt: 1 })
    .limit(limit)
    .lean();

  return {
    totalPending: pendingApps.length,
    applications: pendingApps.map((a) => ({
      applicationId: a._id,
      studentId: a.student?._id,
      name: a.student?.name || 'Student',
      rollNumber: a.studentProfile?.rollNumber || 'N/A',
      department: a.studentProfile?.department || 'General',
      cgpa: a.studentProfile?.cgpa ?? 0,
      company: a.company?.name || 'Company',
      role: a.drive?.jobRole || 'Role',
      packageLPA: a.drive?.packageLPA,
      status: a.status,
      appliedAt: a.appliedAt,
    })),
  };
};

// 12. Monthly/Period Placement Summary Report
export const getPlacementSummary = async (params = {}) => {
  const [appsStats, selectionStats, drivesList] = await Promise.all([
    getApplicationStatistics(),
    getSelectionStatistics(),
    PlacementDrive.find().sort({ createdAt: -1 }).limit(5).populate('company', 'name').lean(),
  ]);

  const activeDrivesCount = await PlacementDrive.countDocuments({
    status: { $in: ['Published', 'Upcoming', 'Ongoing'] },
  });

  return {
    period: 'Current Academic Term',
    summaryMetrics: {
      totalActiveDrives: activeDrivesCount,
      totalRegisteredStudents: selectionStats.totalStudents,
      placedStudentsCount: selectionStats.placedStudents,
      overallPlacementRate: selectionStats.placementPercentage,
      totalApplicationsSubmitted: appsStats.totalApplications,
      applicationsSelected: appsStats.selected,
      applicationsPendingReview: appsStats.reviewPending,
      highestPackageLPA: selectionStats.highestPackageLPA,
      averagePackageLPA: selectionStats.averagePackageLPA,
    },
    departmentHighlights: selectionStats.departmentBreakdown,
    recentDrives: drivesList.map((d) => ({
      title: d.title,
      company: d.company?.name || 'Company',
      role: d.jobRole,
      packageLPA: d.packageLPA,
      status: d.status,
    })),
  };
};

// 13. Student Preparation Insights & Skill Gap Analysis
export const getStudentPreparationInsights = async (params = {}) => {
  const { driveId, department } = params;

  // Retrieve resume analyses
  const analyses = await ResumeAnalysis.find()
    .select('student extractedSkills overallScore recommendations')
    .lean();

  const skillFrequency = {};
  let totalScoreSum = 0;
  let countWithScore = 0;

  for (const a of analyses) {
    if (a.overallScore) {
      totalScoreSum += a.overallScore;
      countWithScore++;
    }
    const allSkills = a.extractedSkills?.all || [];
    for (const s of allSkills) {
      const key = s.trim();
      skillFrequency[key] = (skillFrequency[key] || 0) + 1;
    }
  }

  // Sort top skills across students
  const topStudentSkills = Object.entries(skillFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  // Demand skills from active drives
  const activeDrives = await PlacementDrive.find({
    status: { $in: ['Published', 'Upcoming', 'Ongoing'] },
  }).select('requiredSkills title jobRole');

  const driveSkillDemand = {};
  for (const d of activeDrives) {
    for (const req of d.requiredSkills || []) {
      const k = req.trim();
      driveSkillDemand[k] = (driveSkillDemand[k] || 0) + 1;
    }
  }

  const topDemandSkills = Object.entries(driveSkillDemand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill, count]) => ({ skill, count }));

  // Identify skill gaps (high demand in drives but low in student resumes)
  const skillGaps = [];
  for (const [demandSkill, demandCount] of Object.entries(driveSkillDemand)) {
    const supplyCount = skillFrequency[demandSkill] || 0;
    if (demandCount >= 1 && supplyCount < 5) {
      skillGaps.push({
        skill: demandSkill,
        drivesRequiring: demandCount,
        studentsOffering: supplyCount,
        recommendation: `Conduct workshop or bootcamp on ${demandSkill} to boost selection rates.`,
      });
    }
  }

  const avgResumeQuality =
    countWithScore > 0 ? Math.round(totalScoreSum / countWithScore) : 70;

  return {
    averageResumeQualityScore: avgResumeQuality,
    totalResumesAnalyzed: analyses.length,
    topStudentSkills,
    topDemandSkills,
    identifiedSkillGaps: skillGaps.slice(0, 5),
    actionableRecommendations: [
      {
        area: 'Technical Upskilling',
        priority: 'High',
        action: `Organize targeted technical prep on ${skillGaps.slice(0, 3).map((g) => g.skill).join(', ') || 'Cloud, System Design and Docker'}.`,
      },
      {
        area: 'Project Experience',
        priority: 'Medium',
        action: 'Guide students with 0 verified projects to build and link full-stack projects to their GitHub.',
      },
      {
        area: 'Resume Completeness',
        priority: 'High',
        action: 'Run a campus-wide reminder for students with missing PDF resumes to upload verified documents.',
      },
    ],
  };
};

// 14. Action Staging: Prepare Announcement Draft (Does NOT mutate without confirmation)
export const prepareAnnouncementDraft = async (params = {}) => {
  const { driveId, title, message, targetAudience = 'All Eligible Students' } = params;

  let drive = null;
  if (driveId && mongoose.isValidObjectId(driveId)) {
    drive = await PlacementDrive.findById(driveId).populate('company');
  }

  const draft = {
    actionType: 'PUBLISH_ANNOUNCEMENT',
    driveId: drive?._id || null,
    driveTitle: drive?.title || 'Campus Placement Drive',
    companyName: drive?.company?.name || 'Institutional Partner',
    announcementTitle: title || `Important Update: ${drive?.title || 'Campus Placement Drive'}`,
    message:
      message ||
      `Dear Students,\n\nApplications are officially active for the role of ${drive?.jobRole || 'Software Engineer'} at ${drive?.company?.name || 'our partner organization'}. Please ensure your academic profile and PDF resume are updated before the deadline (${drive?.applicationClosingDate ? new Date(drive.applicationClosingDate).toLocaleDateString() : 'Closing Soon'}).`,
    targetAudience,
    targetCount: 0,
    status: 'CONFIRMATION_REQUIRED',
    requiresApproval: true,
  };

  // Estimate target count
  if (drive) {
    const evalResult = await getStudentEligibility({ driveId: drive._id });
    draft.targetCount = evalResult.eligibleCount || 0;
  } else {
    draft.targetCount = await StudentProfile.countDocuments();
  }

  return draft;
};

// 15. Action Staging: Prepare Shortlist Draft (Does NOT mutate without confirmation)
export const prepareShortlistDraft = async (params = {}) => {
  const { driveId, minCgpa = 7.5, targetStatus = 'Shortlisted' } = params;

  let drive = null;
  if (driveId && mongoose.isValidObjectId(driveId)) {
    drive = await PlacementDrive.findById(driveId).populate('company');
  } else {
    drive = await PlacementDrive.findOne({ status: { $in: ['Published', 'Ongoing'] } }).populate('company');
  }

  if (!drive) {
    return { error: 'No active placement drive found to generate a shortlist proposal.' };
  }

  // Find applicants for this drive who are currently 'Applied' or 'Under Review'
  const applicants = await Application.find({
    drive: drive._id,
    status: { $in: ['Applied', 'Under Review'] },
  })
    .populate('student', 'name email')
    .populate('studentProfile', 'rollNumber department cgpa skills')
    .lean();

  const proposedCandidates = [];

  for (const app of applicants) {
    const cgpa = app.studentProfile?.cgpa ?? app.resumeSnapshot?.studentCgpa ?? 0;
    if (cgpa >= Number(minCgpa)) {
      proposedCandidates.push({
        applicationId: app._id,
        studentId: app.student?._id,
        name: app.student?.name || 'Candidate',
        rollNumber: app.studentProfile?.rollNumber || 'N/A',
        cgpa,
        department: app.studentProfile?.department || 'General',
        currentStatus: app.status,
        proposedStatus: targetStatus,
      });
    }
  }

  return {
    actionType: 'UPDATE_APPLICATION_STATUS_BATCH',
    driveId: drive._id,
    driveTitle: drive.title,
    company: drive.company?.name || 'Company',
    minCgpaCutoff: minCgpa,
    targetStatus,
    proposedCount: proposedCandidates.length,
    proposedCandidates,
    status: 'CONFIRMATION_REQUIRED',
    requiresApproval: true,
    warning: 'Changes will only be applied to official student application records upon your explicit confirmation.',
  };
};
