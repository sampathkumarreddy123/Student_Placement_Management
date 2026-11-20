import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import PlacementDrive from '../models/PlacementDrive.js';
import Application from '../models/Application.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import JobMatch from '../models/JobMatch.js';
import {
  extractTextFromResumeBuffer,
  computeResumeVersion,
  analyzeResumeContent,
  calculateDriveMatch,
} from '../services/resumeIntelligenceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper to retrieve buffer for student's uploaded resume
 */
const getStudentResumeBuffer = async (profile) => {
  let buffer = null;

  if (profile.resumeUrl && profile.resumeUrl.startsWith('/uploads/resumes/')) {
    const filename = profile.resumeUrl.replace('/uploads/resumes/', '');
    const localPath = path.join(__dirname, '../uploads/resumes', filename);
    if (fs.existsSync(localPath)) {
      buffer = fs.readFileSync(localPath);
    }
  }

  if (!buffer && profile.resumeData) {
    buffer = Buffer.from(profile.resumeData, 'base64');
  }

  return buffer;
};

// @desc    Upload new resume (PDF or DOCX) and immediately trigger full AI Intelligence Analysis
// @route   POST /api/ai-resume/upload
// @access  Private (Student)
export const uploadAndAnalyzeResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please choose a PDF (.pdf) or Word document (.docx) to upload.',
      });
    }

    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile record not found.',
      });
    }

    // Clean up previous file if on local disk
    if (profile.resumeUrl && profile.resumeUrl.startsWith('/uploads/resumes/')) {
      const oldFilename = profile.resumeUrl.replace('/uploads/resumes/', '');
      const oldPath = path.join(__dirname, '../uploads/resumes', oldFilename);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (_) {}
      }
    }

    // Update profile resume metadata
    const ext = path.extname(req.file.originalname).toLowerCase();
    profile.resumeUrl = `/uploads/resumes/${req.file.filename}`;
    profile.resumeOriginalName = req.file.originalname;
    profile.resumeSize = req.file.size;
    profile.resumeUpdatedAt = new Date();

    let fileBuffer = null;
    if (fs.existsSync(req.file.path)) {
      fileBuffer = fs.readFileSync(req.file.path);
      profile.resumeData = fileBuffer.toString('base64');
      profile.markModified('resumeData');
    }

    await profile.save();

    // Text extraction
    const rawText = await extractTextFromResumeBuffer(
      fileBuffer,
      req.file.mimetype,
      req.file.originalname
    );

    // AI Analysis
    const analysisData = await analyzeResumeContent(rawText, profile, req.user);
    const resumeVersion = computeResumeVersion(rawText, profile.resumeUpdatedAt);

    // Save or update ResumeAnalysis in MongoDB
    const analysis = await ResumeAnalysis.findOneAndUpdate(
      { student: req.user._id },
      {
        student: req.user._id,
        studentProfile: profile._id,
        resumeUrl: profile.resumeUrl,
        resumeOriginalName: profile.resumeOriginalName,
        resumeFormat: ext === '.docx' ? 'docx' : 'pdf',
        resumeSize: profile.resumeSize,
        resumeUpdatedAt: profile.resumeUpdatedAt,
        resumeVersion,
        rawTextLength: rawText.length,
        ...analysisData,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Synchronize active drive matches in background
    syncStudentDriveMatches(req.user._id, profile, analysis).catch((err) =>
      console.warn('[ResumeIntelligence] Background sync warning:', err.message)
    );

    res.status(200).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully!',
      resume: {
        url: profile.resumeUrl,
        originalName: profile.resumeOriginalName,
        size: profile.resumeSize,
        updatedAt: profile.resumeUpdatedAt,
        format: ext === '.docx' ? 'docx' : 'pdf',
      },
      analysis,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest AI Resume Analysis report for authenticated student
// @route   GET /api/ai-resume/analysis
// @access  Private (Student)
export const getResumeAnalysis = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
      });
    }

    let analysis = await ResumeAnalysis.findOne({ student: req.user._id });

    // If analysis does not exist but a resume is uploaded, generate it on the fly
    if (!analysis && profile.resumeUrl) {
      const buffer = await getStudentResumeBuffer(profile);
      if (buffer) {
        try {
          const rawText = await extractTextFromResumeBuffer(
            buffer,
            '',
            profile.resumeOriginalName || 'resume.pdf'
          );
          const analysisData = await analyzeResumeContent(rawText, profile, req.user);
          const resumeVersion = computeResumeVersion(rawText, profile.resumeUpdatedAt);

          analysis = await ResumeAnalysis.create({
            student: req.user._id,
            studentProfile: profile._id,
            resumeUrl: profile.resumeUrl,
            resumeOriginalName: profile.resumeOriginalName || 'Resume.pdf',
            resumeFormat: (profile.resumeOriginalName || '').toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
            resumeSize: profile.resumeSize || buffer.length,
            resumeUpdatedAt: profile.resumeUpdatedAt || new Date(),
            resumeVersion,
            rawTextLength: rawText.length,
            ...analysisData,
          });

          syncStudentDriveMatches(req.user._id, profile, analysis).catch(() => {});
        } catch (err) {
          console.warn('[ResumeIntelligence] On-the-fly analysis failed:', err.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      hasResume: Boolean(profile.resumeUrl),
      resume: profile.resumeUrl
        ? {
            url: profile.resumeUrl,
            originalName: profile.resumeOriginalName,
            size: profile.resumeSize,
            updatedAt: profile.resumeUpdatedAt,
            format: (profile.resumeOriginalName || '').toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
          }
        : null,
      analysis: analysis || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Re-analyze the student's existing uploaded resume
// @route   POST /api/ai-resume/analyze
// @access  Private (Student)
export const analyzeExistingResume = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile || !profile.resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'No resume document found to analyze. Please upload your resume first.',
      });
    }

    const buffer = await getStudentResumeBuffer(profile);
    if (!buffer) {
      return res.status(400).json({
        success: false,
        message: 'Could not read resume file data. Please re-upload your resume.',
      });
    }

    const rawText = await extractTextFromResumeBuffer(
      buffer,
      '',
      profile.resumeOriginalName || 'resume.pdf'
    );
    const analysisData = await analyzeResumeContent(rawText, profile, req.user);
    const resumeVersion = computeResumeVersion(rawText, profile.resumeUpdatedAt);

    const analysis = await ResumeAnalysis.findOneAndUpdate(
      { student: req.user._id },
      {
        student: req.user._id,
        studentProfile: profile._id,
        resumeUrl: profile.resumeUrl,
        resumeOriginalName: profile.resumeOriginalName,
        resumeFormat: (profile.resumeOriginalName || '').toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
        resumeSize: profile.resumeSize,
        resumeUpdatedAt: profile.resumeUpdatedAt,
        resumeVersion,
        rawTextLength: rawText.length,
        ...analysisData,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Refresh drive matches
    await syncStudentDriveMatches(req.user._id, profile, analysis);

    res.status(200).json({
      success: true,
      message: 'Resume analysis updated successfully!',
      analysis,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI Job Matches against all active placement drives in MongoDB
// @route   GET /api/ai-resume/matches
// @access  Private (Student)
export const getJobMatches = async (req, res, next) => {
  try {
    const { filter = 'all', sort = 'match_desc', search = '' } = req.query;

    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
      });
    }

    const analysis = await ResumeAnalysis.findOne({ student: req.user._id });

    // Fetch all active placement drives
    const drives = await PlacementDrive.find({
      $or: [{ status: 'Active' }, { status: 'Upcoming' }, { isActive: true }],
    }).populate('company', 'name industry website logo');

    // Fetch student's existing applications
    const applications = await Application.find({ student: req.user._id }).select('drive status appliedAt');
    const applicationMap = new Map();
    for (const app of applications) {
      applicationMap.set(app.drive.toString(), app);
    }

    // Compute or retrieve matches for each drive
    const matches = [];
    const now = new Date();

    for (const drive of drives) {
      const app = applicationMap.get(drive._id.toString());
      const matchResult = calculateDriveMatch({
        analysis,
        profile,
        drive,
        student: req.user,
        application: app,
      });

      // Check deadline urgency
      const deadline = drive.applicationClosingDate || drive.registrationDeadline;
      const isClosingSoon = deadline
        ? new Date(deadline) > now && new Date(deadline).getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000
        : false;

      // Check if application window is open
      const isOpen =
        (!drive.applicationOpeningDate || new Date(drive.applicationOpeningDate) <= now) &&
        (!deadline || new Date(deadline) >= now) &&
        drive.status !== 'Completed' &&
        drive.status !== 'Cancelled';

      matches.push({
        driveId: drive._id,
        drive: {
          _id: drive._id,
          title: drive.title,
          jobRole: drive.jobRole,
          packageLPA: drive.packageLPA,
          location: drive.location,
          employmentType: drive.employmentType,
          vacancies: drive.vacancies,
          status: drive.status,
          applicationOpeningDate: drive.applicationOpeningDate,
          applicationClosingDate: deadline,
          requiredSkills: drive.requiredSkills || [],
          company: drive.company,
          isClosingSoon,
          isOpen,
        },
        ...matchResult,
      });
    }

    // Filter results
    let filtered = matches;

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.drive.title?.toLowerCase().includes(q) ||
          m.drive.jobRole?.toLowerCase().includes(q) ||
          m.drive.company?.name?.toLowerCase().includes(q)
      );
    }

    if (filter === 'best') {
      filtered = filtered.filter((m) => m.matchPercentage >= 70);
    } else if (filter === 'applied') {
      filtered = filtered.filter((m) => m.hasApplied);
    } else if (filter === 'closing_soon') {
      filtered = filtered.filter((m) => m.drive.isClosingSoon);
    }

    // Sort results
    if (sort === 'match_asc') {
      filtered.sort((a, b) => a.matchPercentage - b.matchPercentage);
    } else if (sort === 'package_desc') {
      filtered.sort((a, b) => (b.drive.packageLPA || 0) - (a.drive.packageLPA || 0));
    } else if (sort === 'deadline_asc') {
      filtered.sort((a, b) => {
        const da = a.drive.applicationClosingDate ? new Date(a.drive.applicationClosingDate).getTime() : Infinity;
        const db = b.drive.applicationClosingDate ? new Date(b.drive.applicationClosingDate).getTime() : Infinity;
        return da - db;
      });
    } else {
      // Default: match_desc
      filtered.sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      totalDrives: drives.length,
      hasResume: Boolean(profile.resumeUrl),
      matches: filtered,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed match breakdown for a single drive
// @route   GET /api/ai-resume/matches/:driveId
// @access  Private (Student)
export const getSingleDriveMatch = async (req, res, next) => {
  try {
    const { driveId } = req.params;

    const drive = await PlacementDrive.findById(driveId).populate('company', 'name industry website logo');
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found.',
      });
    }

    const profile = await StudentProfile.findOne({ user: req.user._id });
    const analysis = await ResumeAnalysis.findOne({ student: req.user._id });
    const application = await Application.findOne({ student: req.user._id, drive: driveId });

    const match = calculateDriveMatch({
      analysis,
      profile,
      drive,
      student: req.user,
      application,
    });

    res.status(200).json({
      success: true,
      drive,
      match,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh/recalculate match for a specific drive
// @route   POST /api/ai-resume/matches/:driveId/refresh
// @access  Private (Student)
export const refreshSingleDriveMatch = async (req, res, next) => {
  try {
    const { driveId } = req.params;

    const drive = await PlacementDrive.findById(driveId).populate('company', 'name industry website logo');
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found.',
      });
    }

    const profile = await StudentProfile.findOne({ user: req.user._id });
    const analysis = await ResumeAnalysis.findOne({ student: req.user._id });
    const application = await Application.findOne({ student: req.user._id, drive: driveId });

    const matchResult = calculateDriveMatch({
      analysis,
      profile,
      drive,
      student: req.user,
      application,
    });

    // Save or update in JobMatch collection
    const saved = await JobMatch.findOneAndUpdate(
      { student: req.user._id, drive: driveId },
      {
        student: req.user._id,
        studentProfile: profile._id,
        drive: driveId,
        resumeAnalysis: analysis?._id,
        ...matchResult,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Job match refreshed successfully!',
      match: matchResult,
      jobMatchRecord: saved,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregate Placement Officer AI Resume Insights & Skill-Demand analytics
// @route   GET /api/officer/ai-resume/insights
// @access  Private (Officer)
export const getOfficerInsights = async (req, res, next) => {
  try {
    const [students, drives, analyses] = await Promise.all([
      StudentProfile.find({}).populate('user', 'name email'),
      PlacementDrive.find({
        $or: [{ status: 'Active' }, { status: 'Upcoming' }, { isActive: true }],
      }).populate('company', 'name'),
      ResumeAnalysis.find({}),
    ]);

    const totalStudents = students.length;
    const studentsWithResume = students.filter((s) => Boolean(s.resumeUrl)).length;
    const studentsMissingResume = totalStudents - studentsWithResume;

    // Average overall quality score
    const validScores = analyses.map((a) => a.overallScore).filter((s) => s > 0);
    const avgScore = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;

    // Average score by department
    const deptScores = {};
    for (const a of analyses) {
      const studentProfile = students.find((s) => s._id.toString() === a.studentProfile?.toString());
      const dept = studentProfile?.department || 'General';
      if (!deptScores[dept]) deptScores[dept] = [];
      deptScores[dept].push(a.overallScore);
    }

    const deptAverages = Object.entries(deptScores).map(([department, scores]) => ({
      department,
      count: scores.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

    // Aggregate drive skill demands
    const driveSkillCounts = {};
    for (const drive of drives) {
      const skills = Array.isArray(drive.requiredSkills) ? drive.requiredSkills : [];
      for (const sk of skills) {
        const norm = sk.trim();
        if (norm) {
          driveSkillCounts[norm] = (driveSkillCounts[norm] || 0) + 1;
        }
      }
    }

    // Aggregate student skills
    const studentSkillCounts = {};
    for (const a of analyses) {
      const skills = a.extractedSkills?.all || [];
      for (const sk of skills) {
        studentSkillCounts[sk] = (studentSkillCounts[sk] || 0) + 1;
      }
    }

    // Top demanded skills with student acquisition comparison
    const topDemandedSkills = Object.entries(driveSkillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, driveDemandCount]) => {
        const studentPossessingCount = studentSkillCounts[skill] || 0;
        const studentCoveragePct = totalStudents > 0 ? Math.round((studentPossessingCount / totalStudents) * 100) : 0;
        return {
          skill,
          driveDemandCount,
          studentPossessingCount,
          studentCoveragePct,
        };
      });

    // Recent analyzed candidates
    const recentAnalyses = analyses
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10)
      .map((a) => {
        const p = students.find((s) => s._id.toString() === a.studentProfile?.toString());
        return {
          studentId: a.student,
          name: p?.user?.name || 'Student',
          rollNumber: p?.rollNumber || '—',
          department: p?.department || '—',
          cgpa: p?.cgpa || 0,
          overallScore: a.overallScore,
          extractedSkillsCount: a.extractedSkills?.all?.length || 0,
          updatedAt: a.updatedAt,
        };
      });

    res.status(200).json({
      success: true,
      kpis: {
        totalStudents,
        studentsWithResume,
        studentsMissingResume,
        resumesAnalyzed: analyses.length,
        avgQualityScore: avgScore,
        activeDrivesCount: drives.length,
      },
      deptAverages,
      topDemandedSkills,
      recentAnalyses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed resume analysis for a specific student (Placement Officer view)
// @route   GET /api/officer/ai-resume/students/:studentId
// @access  Private (Officer)
export const getOfficerStudentAnalysis = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId).select('name email role');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
      });
    }

    const profile = await StudentProfile.findOne({ user: studentId });
    const analysis = await ResumeAnalysis.findOne({ student: studentId });

    res.status(200).json({
      success: true,
      student,
      profile,
      hasResume: Boolean(profile?.resumeUrl),
      analysis,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student match rankings for a specific placement drive (Placement Officer view)
// @route   GET /api/officer/ai-resume/drives/:driveId/matches
// @access  Private (Officer)
export const getOfficerDriveMatches = async (req, res, next) => {
  try {
    const { driveId } = req.params;

    const drive = await PlacementDrive.findById(driveId).populate('company', 'name industry website logo');
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found.',
      });
    }

    const [students, analyses, applications] = await Promise.all([
      StudentProfile.find({}).populate('user', 'name email'),
      ResumeAnalysis.find({}),
      Application.find({ drive: driveId }),
    ]);

    const appMap = new Map();
    for (const a of applications) {
      appMap.set(a.student.toString(), a);
    }

    const analysisMap = new Map();
    for (const an of analyses) {
      analysisMap.set(an.student.toString(), an);
    }

    const candidateMatches = [];

    for (const p of students) {
      if (!p.resumeUrl) continue;
      const an = analysisMap.get(p.user?._id?.toString());
      const app = appMap.get(p.user?._id?.toString());

      const match = calculateDriveMatch({
        analysis: an,
        profile: p,
        drive,
        student: p.user,
        application: app,
      });

      candidateMatches.push({
        studentId: p.user?._id,
        name: p.user?.name || 'Student',
        email: p.user?.email,
        rollNumber: p.rollNumber,
        department: p.department,
        cgpa: p.cgpa,
        matchPercentage: match.matchPercentage,
        matchingSkills: match.matchingSkills,
        missingSkills: match.missingSkills,
        experienceRelevance: match.experienceRelevance,
        scoreBreakdown: match.scoreBreakdown,
        officialEligibility: match.officialEligibility,
        hasApplied: Boolean(app),
        applicationId: app?._id,
        applicationStatus: app?.status,
      });
    }

    // Rank from highest match percentage to lowest
    candidateMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({
      success: true,
      drive: {
        _id: drive._id,
        title: drive.title,
        jobRole: drive.jobRole,
        packageLPA: drive.packageLPA,
        company: drive.company,
        requiredSkills: drive.requiredSkills,
      },
      totalCandidates: candidateMatches.length,
      matches: candidateMatches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Background helper to synchronize/cache drive matches for a student
 */
async function syncStudentDriveMatches(studentId, profile, analysis) {
  try {
    const drives = await PlacementDrive.find({
      $or: [{ status: 'Active' }, { status: 'Upcoming' }, { isActive: true }],
    });

    for (const drive of drives) {
      const app = await Application.findOne({ student: studentId, drive: drive._id });
      const matchResult = calculateDriveMatch({
        analysis,
        profile,
        drive,
        student: { _id: studentId },
        application: app,
      });

      await JobMatch.findOneAndUpdate(
        { student: studentId, drive: drive._id },
        {
          student: studentId,
          studentProfile: profile._id,
          drive: drive._id,
          resumeAnalysis: analysis?._id,
          resumeVersion: analysis?.resumeVersion,
          ...matchResult,
        },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.warn('[ResumeIntelligence] syncStudentDriveMatches warning:', err.message);
  }
}

export default {
  uploadAndAnalyzeResume,
  getResumeAnalysis,
  analyzeExistingResume,
  getJobMatches,
  getSingleDriveMatch,
  refreshSingleDriveMatch,
  getOfficerInsights,
  getOfficerStudentAnalysis,
  getOfficerDriveMatches,
};
