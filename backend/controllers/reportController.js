import mongoose from 'mongoose';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Company from '../models/Company.js';
import PlacementDrive from '../models/PlacementDrive.js';
import Application from '../models/Application.js';
import RecruitmentRound from '../models/RecruitmentRound.js';

/**
 * Helper to construct common filter query based on request parameters
 */
const buildApplicationFilter = async (query) => {
  const filter = {};

  if (query.status && query.status !== 'All') {
    filter.status = query.status;
  }

  if (query.company && query.company !== 'All') {
    filter.company = new mongoose.Types.ObjectId(query.company);
  }

  if (query.drive && query.drive !== 'All') {
    filter.drive = new mongoose.Types.ObjectId(query.drive);
  }

  // Profile-level filters (department, batch/academicYear)
  const profileMatch = {};
  if (query.department && query.department !== 'All') {
    profileMatch.department = query.department;
  }
  if (query.academicYear && query.academicYear !== 'All') {
    profileMatch.batch = Number(query.academicYear);
  }

  if (Object.keys(profileMatch).length > 0) {
    const matchingProfiles = await StudentProfile.find(profileMatch).select('user');
    const userIds = matchingProfiles.map((p) => p.user).filter(Boolean);
    filter.student = { $in: userIds };
  }

  return filter;
};

/**
 * 1. Get Overall Dashboard Statistics
 * GET /api/reports/statistics
 */
export const getReportStatistics = async (req, res, next) => {
  try {
    const filter = await buildApplicationFilter(req.query);

    // Profile query for student counts
    const profileQuery = {};
    if (req.query.department && req.query.department !== 'All') {
      profileQuery.department = req.query.department;
    }
    if (req.query.academicYear && req.query.academicYear !== 'All') {
      profileQuery.batch = Number(req.query.academicYear);
    }

    const [
      totalRegisteredStudents,
      totalEligibleStudents,
      totalCompanies,
      totalPlacementDrives,
      totalApplications,
      selectedStudentIds,
      rejectedStudentIds,
    ] = await Promise.all([
      StudentProfile.countDocuments(profileQuery),
      StudentProfile.countDocuments({
        ...profileQuery,
        cgpa: { $gte: 6.0 },
        backlogs: { $lte: 0 },
      }),
      Company.countDocuments(),
      PlacementDrive.countDocuments(),
      Application.countDocuments(filter),
      Application.distinct('student', { ...filter, status: 'Selected' }),
      Application.distinct('student', { ...filter, status: 'Rejected' }),
    ]);

    const totalSelectedStudents = selectedStudentIds.length;
    const totalRejectedStudents = rejectedStudentIds.length;

    // Correct placement percentage calculation: unique selected students / total registered students
    const overallPlacementPercentage =
      totalRegisteredStudents > 0
        ? Number(((totalSelectedStudents / totalRegisteredStudents) * 100).toFixed(1))
        : 0;

    // Eligible placement percentage: unique selected students / eligible students
    const eligiblePlacementPercentage =
      totalEligibleStudents > 0
        ? Number(((totalSelectedStudents / totalEligibleStudents) * 100).toFixed(1))
        : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalRegisteredStudents,
        totalEligibleStudents,
        totalCompanies,
        totalPlacementDrives,
        totalApplications,
        totalSelectedStudents,
        totalRejectedStudents,
        overallPlacementPercentage,
        eligiblePlacementPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get Comprehensive Reports & Analytics
 * GET /api/reports/analytics
 */
export const getFullAnalyticsReports = async (req, res, next) => {
  try {
    const filter = await buildApplicationFilter(req.query);

    // Profile query
    const profileQuery = {};
    if (req.query.department && req.query.department !== 'All') {
      profileQuery.department = req.query.department;
    }
    if (req.query.academicYear && req.query.academicYear !== 'All') {
      profileQuery.batch = Number(req.query.academicYear);
    }

    // -------------------------------------------------------------
    // REPORT 1: Department-wise Placement Report
    // -------------------------------------------------------------
    const allProfiles = await StudentProfile.find(profileQuery).lean();
    const allSelectedApps = await Application.find({ status: 'Selected' })
      .populate('drive', 'packageLPA')
      .populate('studentProfile', 'department batch')
      .lean();

    const allApps = await Application.find().populate('studentProfile', 'department').lean();

    // Group by department
    const departmentsMap = {};
    const DEPARTMENTS = [
      'Computer Science',
      'Information Technology',
      'Electronics & Communication',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
    ];

    DEPARTMENTS.forEach((dept) => {
      departmentsMap[dept] = {
        department: dept,
        totalStudents: 0,
        placedStudents: 0,
        totalApplications: 0,
        totalPackages: [],
        placementRate: 0,
        averagePackage: 0,
        highestPackage: 0,
      };
    });

    // Count registered students
    allProfiles.forEach((p) => {
      const dept = p.department || 'Computer Science';
      if (!departmentsMap[dept]) {
        departmentsMap[dept] = {
          department: dept,
          totalStudents: 0,
          placedStudents: 0,
          totalApplications: 0,
          totalPackages: [],
          placementRate: 0,
          averagePackage: 0,
          highestPackage: 0,
        };
      }
      departmentsMap[dept].totalStudents++;
    });

    // Count applications
    allApps.forEach((a) => {
      const dept = a.studentProfile?.department || a.resumeSnapshot?.studentDepartment;
      if (dept && departmentsMap[dept]) {
        departmentsMap[dept].totalApplications++;
      }
    });

    // Count unique placed students & packages
    const placedStudentsPerDept = new Map();
    allSelectedApps.forEach((a) => {
      const dept = a.studentProfile?.department || a.resumeSnapshot?.studentDepartment;
      const studentId = String(a.student);
      const pkg = Number(a.drive?.packageLPA) || 0;

      if (dept && departmentsMap[dept]) {
        if (!placedStudentsPerDept.has(`${dept}_${studentId}`)) {
          placedStudentsPerDept.set(`${dept}_${studentId}`, true);
          departmentsMap[dept].placedStudents++;
        }
        if (pkg > 0) {
          departmentsMap[dept].totalPackages.push(pkg);
        }
      }
    });

    const departmentReport = Object.values(departmentsMap).map((d) => {
      const avg =
        d.totalPackages.length > 0
          ? Number(
              (
                d.totalPackages.reduce((acc, curr) => acc + curr, 0) /
                d.totalPackages.length
              ).toFixed(2)
            )
          : 0;
      const max = d.totalPackages.length > 0 ? Math.max(...d.totalPackages) : 0;
      const rate =
        d.totalStudents > 0
          ? Number(((d.placedStudents / d.totalStudents) * 100).toFixed(1))
          : 0;

      return {
        department: d.department,
        totalStudents: d.totalStudents,
        placedStudents: d.placedStudents,
        totalApplications: d.totalApplications,
        placementRate: rate,
        averagePackage: avg,
        highestPackage: max,
      };
    });

    // -------------------------------------------------------------
    // REPORT 2: Company-wise Selection Report
    // -------------------------------------------------------------
    const companies = await Company.find().lean();
    const drives = await PlacementDrive.find().lean();
    const applications = await Application.find(filter)
      .populate('company', 'name industry location')
      .populate('drive', 'jobRole packageLPA title')
      .lean();

    const companyReportMap = {};
    companies.forEach((comp) => {
      companyReportMap[String(comp._id)] = {
        companyId: comp._id,
        companyName: comp.name,
        industry: comp.industry || 'Technology',
        location: comp.location || 'Multiple',
        drivesCount: 0,
        applicantCount: 0,
        selectedCount: 0,
        packages: [],
        selectionRate: 0,
        averagePackage: 0,
        highestPackage: 0,
      };
    });

    drives.forEach((d) => {
      const compId = String(d.company);
      if (companyReportMap[compId]) {
        companyReportMap[compId].drivesCount++;
      }
    });

    applications.forEach((app) => {
      const compId = String(app.company?._id || app.company);
      if (companyReportMap[compId]) {
        companyReportMap[compId].applicantCount++;
        const pkg = Number(app.drive?.packageLPA) || 0;
        if (pkg > 0) companyReportMap[compId].packages.push(pkg);

        if (app.status === 'Selected') {
          companyReportMap[compId].selectedCount++;
        }
      }
    });

    const companyReport = Object.values(companyReportMap)
      .map((c) => {
        const rate =
          c.applicantCount > 0
            ? Number(((c.selectedCount / c.applicantCount) * 100).toFixed(1))
            : 0;
        const avg =
          c.packages.length > 0
            ? Number(
                (c.packages.reduce((a, b) => a + b, 0) / c.packages.length).toFixed(2)
              )
            : 0;
        const max = c.packages.length > 0 ? Math.max(...c.packages) : 0;
        return {
          companyId: c.companyId,
          companyName: c.companyName,
          industry: c.industry,
          location: c.location,
          drivesCount: c.drivesCount,
          applicantCount: c.applicantCount,
          selectedCount: c.selectedCount,
          selectionRate: rate,
          averagePackage: avg,
          highestPackage: max,
        };
      })
      .filter((c) => c.drivesCount > 0 || c.applicantCount > 0);

    // -------------------------------------------------------------
    // REPORT 3: Academic Year-wise (Batch) Placement Report
    // -------------------------------------------------------------
    const batchMap = {};
    const CURRENT_YEAR = new Date().getFullYear();
    const BATCHES = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

    BATCHES.forEach((b) => {
      batchMap[b] = {
        batch: b,
        academicYear: `Class of ${b}`,
        totalStudents: 0,
        placedStudents: 0,
        placementRate: 0,
        totalOffers: 0,
        packages: [],
        averagePackage: 0,
        highestPackage: 0,
      };
    });

    allProfiles.forEach((p) => {
      const b = p.batch || CURRENT_YEAR;
      if (!batchMap[b]) {
        batchMap[b] = {
          batch: b,
          academicYear: `Class of ${b}`,
          totalStudents: 0,
          placedStudents: 0,
          placementRate: 0,
          totalOffers: 0,
          packages: [],
          averagePackage: 0,
          highestPackage: 0,
        };
      }
      batchMap[b].totalStudents++;
    });

    const placedBatchMap = new Map();
    allSelectedApps.forEach((a) => {
      const b = a.studentProfile?.batch || CURRENT_YEAR;
      const studentId = String(a.student);
      const pkg = Number(a.drive?.packageLPA) || 0;

      if (!batchMap[b]) {
        batchMap[b] = {
          batch: b,
          academicYear: `Class of ${b}`,
          totalStudents: 0,
          placedStudents: 0,
          placementRate: 0,
          totalOffers: 0,
          packages: [],
          averagePackage: 0,
          highestPackage: 0,
        };
      }

      batchMap[b].totalOffers++;
      if (pkg > 0) batchMap[b].packages.push(pkg);

      if (!placedBatchMap.has(`${b}_${studentId}`)) {
        placedBatchMap.set(`${b}_${studentId}`, true);
        batchMap[b].placedStudents++;
      }
    });

    const academicYearReport = Object.values(batchMap).map((b) => {
      const rate =
        b.totalStudents > 0
          ? Number(((b.placedStudents / b.totalStudents) * 100).toFixed(1))
          : 0;
      const avg =
        b.packages.length > 0
          ? Number(
              (b.packages.reduce((x, y) => x + y, 0) / b.packages.length).toFixed(2)
            )
          : 0;
      const max = b.packages.length > 0 ? Math.max(...b.packages) : 0;
      return {
        batch: b.batch,
        academicYear: b.academicYear,
        totalStudents: b.totalStudents,
        placedStudents: b.placedStudents,
        placementRate: rate,
        totalOffers: b.totalOffers,
        averagePackage: avg,
        highestPackage: max,
      };
    });

    // -------------------------------------------------------------
    // REPORT 4: Placement Drive-wise Applicant Report
    // -------------------------------------------------------------
    const drivesList = await PlacementDrive.find()
      .populate('company', 'name')
      .lean();

    const driveReport = await Promise.all(
      drivesList.map(async (d) => {
        const driveApps = await Application.find({ drive: d._id }).lean();
        const total = driveApps.length;
        const underReview = driveApps.filter(
          (a) => a.status === 'Under Review' || a.status === 'Applied'
        ).length;
        const shortlisted = driveApps.filter((a) => a.status === 'Shortlisted').length;
        const interviewing = driveApps.filter((a) => a.status === 'Interviewing').length;
        const selected = driveApps.filter((a) => a.status === 'Selected').length;
        const rejected = driveApps.filter((a) => a.status === 'Rejected').length;

        const conversionRate =
          total > 0 ? Number(((selected / total) * 100).toFixed(1)) : 0;

        return {
          driveId: d._id,
          title: d.title,
          jobRole: d.jobRole,
          companyName: d.company?.name || 'Company',
          packageLPA: d.packageLPA,
          status: d.status,
          totalApplicants: total,
          underReviewCount: underReview,
          shortlistedCount: shortlisted,
          interviewingCount: interviewing,
          selectedCount: selected,
          rejectedCount: rejected,
          conversionRate,
        };
      })
    );

    // -------------------------------------------------------------
    // REPORT 5: Application Status Breakdown Report
    // -------------------------------------------------------------
    const totalAppsCount = applications.length;
    const statusCounts = {
      Applied: 0,
      'Under Review': 0,
      Shortlisted: 0,
      Interviewing: 0,
      Selected: 0,
      Rejected: 0,
    };

    applications.forEach((a) => {
      if (statusCounts[a.status] !== undefined) {
        statusCounts[a.status]++;
      }
    });

    const statusReport = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage:
        totalAppsCount > 0 ? Number(((count / totalAppsCount) * 100).toFixed(1)) : 0,
    }));

    // -------------------------------------------------------------
    // REPORT 6: Recruitment Round-wise Selection Report
    // -------------------------------------------------------------
    const allRounds = await RecruitmentRound.find().sort({ roundNumber: 1 }).lean();
    const roundMap = {};

    allRounds.forEach((r) => {
      const key = `Round ${r.roundNumber}: ${r.name}`;
      if (!roundMap[key]) {
        roundMap[key] = {
          roundNumber: r.roundNumber,
          roundName: r.name,
          totalCandidates: 0,
          passed: 0,
          failed: 0,
          pending: 0,
        };
      }
    });

    // Check application roundResults
    applications.forEach((a) => {
      a.roundResults?.forEach((r) => {
        const key = `Round ${r.roundNumber}: ${r.roundName}`;
        if (!roundMap[key]) {
          roundMap[key] = {
            roundNumber: r.roundNumber,
            roundName: r.roundName,
            totalCandidates: 0,
            passed: 0,
            failed: 0,
            pending: 0,
          };
        }
        roundMap[key].totalCandidates++;
        if (r.status === 'Passed') roundMap[key].passed++;
        else if (r.status === 'Failed' || r.status === 'Absent') roundMap[key].failed++;
        else roundMap[key].pending++;
      });
    });

    const roundReport = Object.values(roundMap).map((r) => {
      const evaluated = r.passed + r.failed;
      const passRate = evaluated > 0 ? Math.round((r.passed / evaluated) * 100) : 0;
      return {
        ...r,
        passRate,
      };
    });

    // -------------------------------------------------------------
    // REPORT 7: Salary / Package Distribution Report
    // -------------------------------------------------------------
    const packageSlabs = [
      { slab: '< 4 LPA', min: 0, max: 3.99, count: 0, offers: [] },
      { slab: '4 - 7 LPA', min: 4.0, max: 6.99, count: 0, offers: [] },
      { slab: '7 - 10 LPA', min: 7.0, max: 9.99, count: 0, offers: [] },
      { slab: '10 - 15 LPA', min: 10.0, max: 14.99, count: 0, offers: [] },
      { slab: '15+ LPA', min: 15.0, max: 999, count: 0, offers: [] },
    ];

    const allPlacedPackages = [];
    allSelectedApps.forEach((a) => {
      const pkg = Number(a.drive?.packageLPA) || 0;
      if (pkg > 0) {
        allPlacedPackages.push(pkg);
        const targetSlab = packageSlabs.find((s) => pkg >= s.min && pkg <= s.max);
        if (targetSlab) {
          targetSlab.count++;
          targetSlab.offers.push(pkg);
        }
      }
    });

    const highestPackage = allPlacedPackages.length > 0 ? Math.max(...allPlacedPackages) : 0;
    const lowestPackage = allPlacedPackages.length > 0 ? Math.min(...allPlacedPackages) : 0;
    const averagePackage =
      allPlacedPackages.length > 0
        ? Number(
            (
              allPlacedPackages.reduce((sum, p) => sum + p, 0) /
              allPlacedPackages.length
            ).toFixed(2)
          )
        : 0;

    // Median package calculation
    let medianPackage = 0;
    if (allPlacedPackages.length > 0) {
      const sorted = [...allPlacedPackages].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianPackage =
        sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    const packageDistributionReport = {
      slabs: packageSlabs.map((s) => ({
        slab: s.slab,
        count: s.count,
        percentage:
          allPlacedPackages.length > 0
            ? Number(((s.count / allPlacedPackages.length) * 100).toFixed(1))
            : 0,
      })),
      metrics: {
        highestPackage,
        lowestPackage,
        averagePackage,
        medianPackage,
        totalOffersCount: allPlacedPackages.length,
      },
    };

    res.status(200).json({
      success: true,
      reports: {
        departmentReport,
        companyReport,
        academicYearReport,
        driveReport,
        statusReport,
        roundReport,
        packageDistributionReport,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Export Applicants List (Ready for Excel / CSV format)
 * GET /api/reports/export/applicants
 */
export const exportApplicants = async (req, res, next) => {
  try {
    const filter = await buildApplicationFilter(req.query);

    const applications = await Application.find(filter)
      .populate('student', 'name email')
      .populate('studentProfile')
      .populate('company', 'name')
      .populate('drive', 'jobRole packageLPA')
      .sort({ appliedAt: -1 })
      .lean();

    const data = applications.map((app) => ({
      applicantId: String(app._id).slice(-8).toUpperCase(),
      studentName: app.student?.name || 'N/A',
      collegeEmail: app.student?.email || 'N/A',
      rollNumber:
        app.studentProfile?.rollNumber ||
        app.resumeSnapshot?.studentRollNumber ||
        'N/A',
      department:
        app.studentProfile?.department ||
        app.resumeSnapshot?.studentDepartment ||
        'N/A',
      batch: app.studentProfile?.batch || '2026',
      cgpa:
        app.studentProfile?.cgpa !== undefined
          ? app.studentProfile.cgpa
          : app.resumeSnapshot?.studentCgpa || 0,
      company: app.company?.name || 'Company',
      jobRole: app.drive?.jobRole || 'Role',
      packageLPA: app.drive?.packageLPA ? `₹${app.drive.packageLPA} LPA` : 'N/A',
      status: app.status,
      currentRound: `Round ${app.currentRound || 1}`,
      appliedDate: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A',
      officerRemarks: app.selectionRemarks || app.officerNotes || 'None',
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Export Selected Students List
 * GET /api/reports/export/selected
 */
export const exportSelectedStudents = async (req, res, next) => {
  try {
    const filter = await buildApplicationFilter(req.query);

    const selectedApps = await Application.find({ ...filter, status: 'Selected' })
      .populate('student', 'name email')
      .populate('studentProfile')
      .populate('company', 'name industry')
      .populate('drive', 'jobRole packageLPA title')
      .sort({ updatedAt: -1 })
      .lean();

    const data = selectedApps.map((app) => ({
      selectionId: String(app._id).slice(-8).toUpperCase(),
      studentName: app.student?.name || 'Student',
      collegeEmail: app.student?.email || 'N/A',
      rollNumber:
        app.studentProfile?.rollNumber ||
        app.resumeSnapshot?.studentRollNumber ||
        'N/A',
      department:
        app.studentProfile?.department ||
        app.resumeSnapshot?.studentDepartment ||
        'N/A',
      batch: app.studentProfile?.batch || '2026',
      cgpa:
        app.studentProfile?.cgpa !== undefined
          ? app.studentProfile.cgpa
          : app.resumeSnapshot?.studentCgpa || 0,
      placedCompany: app.company?.name || 'Company',
      jobRole: app.drive?.jobRole || app.drive?.title || 'Engineer',
      offeredPackage: app.drive?.packageLPA ? `₹${app.drive.packageLPA} LPA` : 'Confirmed',
      selectionRemarks: app.selectionRemarks || 'Selected in final recruitment round',
      placedDate: app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'N/A',
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};
