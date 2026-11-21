import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Application from '../models/Application.js';
import PlacementDrive from '../models/PlacementDrive.js';
import RecruitmentRound from '../models/RecruitmentRound.js';
import StudentProfile from '../models/StudentProfile.js';
import { checkEligibility } from '../services/eligibilityService.js';
import { evaluateApplicantMatch } from '../services/aiScreeningService.js';
import {
  notifyOnApplicationSubmitted,
  notifyOnApplicationStatusChange,
} from '../services/notificationService.js';
import {
  enqueueStatusUpdateNotification,
  getOutboxStatusForApplication,
  retryOutboxNotification,
} from '../services/notificationQueueService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Apply for a placement drive
// @route   POST /api/applications/apply/:driveId
// @access  Private (Student only)
export const applyForDrive = async (req, res, next) => {
  try {
    const { driveId } = req.params;

    // 1. Fetch placement drive and verify existence
    const drive = await PlacementDrive.findById(driveId).populate('company');
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found.',
      });
    }

    // 2. Check drive status - must be published and open
    if (drive.status === 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'This placement drive is in draft mode and not accepting applications.',
      });
    }

    if (drive.status === 'Closed' || drive.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Applications for this placement drive are closed.',
      });
    }

    // 3. Check application deadlines
    const now = new Date();
    if (drive.applicationOpeningDate && new Date(drive.applicationOpeningDate) > now) {
      return res.status(400).json({
        success: false,
        message: `Applications for this drive will open on ${new Date(drive.applicationOpeningDate).toLocaleDateString()}.`,
      });
    }

    const deadline = drive.applicationClosingDate || drive.registrationDeadline;
    if (deadline && new Date(deadline) < now) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed. Late submissions are not permitted.',
      });
    }

    // 4. Check if student profile exists (including binary resumeData)
    const profile = await StudentProfile.findOne({ user: req.user._id }).select('+resumeData');
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Student profile not found. Please complete your profile before applying.',
      });
    }

    // 5. Verify required profile information (resume & essential academic metrics)
    const resumeUrl = profile.resumeUrl || profile.resume?.fileUrl;
    if (!resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'A resume is required to apply. Please upload your PDF resume in your Student Profile.',
      });
    }

    const rollNumber = profile.rollNumber || profile.personal?.rollNumber;
    const department = profile.department || profile.academics?.department;
    const studentCgpa = profile.cgpa !== undefined ? profile.cgpa : profile.academics?.currentCgpa;

    if (
      !rollNumber ||
      !department ||
      studentCgpa === undefined ||
      studentCgpa === null
    ) {
      return res.status(400).json({
        success: false,
        message: 'Your profile is missing required academic details (roll number, department, or CGPA). Please update your profile.',
      });
    }

    // 6. Check eligibility using comprehensive evaluation
    const eligibility = checkEligibility(profile, drive);
    if (!eligibility.isEligible) {
      return res.status(400).json({
        success: false,
        message: eligibility.hasIncompleteProfile
          ? 'Cannot apply: Your student profile has incomplete academic information.'
          : 'You are not eligible for this placement drive.',
        reasons: eligibility.reasons,
        eligibilityDetails: eligibility.criteriaDetails,
        hasIncompleteProfile: eligibility.hasIncompleteProfile,
        missingProfileFields: eligibility.missingProfileFields,
      });
    }

    // 7. Prevent duplicate applications
    const existingApplication = await Application.findOne({
      student: req.user._id,
      drive: drive._id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this placement drive. Duplicate submissions are not allowed.',
      });
    }

    // 8. Capture resume and student snapshot at submission time
    const existingRounds = await RecruitmentRound.find({ drive: drive._id }).sort({ roundNumber: 1 });
    const initialRoundResults = existingRounds.map((r) => ({
      round: r._id,
      roundNumber: r.roundNumber,
      roundName: r.name,
      status: 'Pending',
      remarks: r.description || '',
      evaluatedAt: new Date(),
    }));

    const application = await Application.create({
      student: req.user._id,
      company: drive.company?._id || drive.company,
      drive: drive._id,
      studentProfile: profile._id,
      appliedAt: new Date(),
      status: 'Applied',
      currentRound: 1,
      roundResults: initialRoundResults,
      resumeSnapshot: {
        resumeUrl: resumeUrl,
        resumeOriginalName: profile.resumeOriginalName || profile.resume?.originalName || 'Resume.pdf',
        resumeSize: profile.resumeSize || profile.resume?.fileSize || 0,
        resumeData: profile.resumeData || '',
        studentCgpa: studentCgpa,
        studentDepartment: department,
        studentRollNumber: rollNumber,
        skills: profile.skills || [],
      },
      selectionRemarks: '',
      officerNotes: '',
      statusHistory: [
        {
          previousStatus: 'None',
          newStatus: 'Applied',
          updatedBy: req.user._id,
          updatedDate: new Date(),
          remarks: 'Application submitted by student.',
        },
      ],
    });

    // Notify Student and Placement Officers
    notifyOnApplicationSubmitted(application, req.user, drive, drive.company).catch((err) =>
      console.error('Failed to dispatch application notifications:', err)
    );

    res.status(201).json({
      success: true,
      message: `Application successfully submitted to ${drive.company?.name || 'Company'} for ${drive.jobRole}!`,
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in student's applications
// @route   GET /api/applications/my
// @access  Private (Student only)
export const getMyApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { student: req.user._id };

    if (status && status !== 'All') {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('company', 'name industry location website logoUrl')
      .populate('statusHistory.updatedBy', 'name email')
      .populate({
        path: 'drive',
        populate: { path: 'company', select: 'name industry location website logoUrl' },
      })
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get application details by ID (Student for own app, or Officer)
// @route   GET /api/applications/:id
// @access  Private
export const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('student', 'name email profilePhoto phone')
      .populate('studentProfile')
      .populate('company', 'name industry location website logoUrl contactEmail')
      .populate('statusHistory.updatedBy', 'name email')
      .populate({
        path: 'drive',
        populate: { path: 'company', select: 'name industry location website logoUrl' },
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application record not found.',
      });
    }

    // Security rule: Students can strictly only view their own applications
    if (req.user.role === 'student' && application.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own applications.',
      });
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download or preview applicant's resume
// @route   GET /api/applications/:id/resume
// @access  Private (Officer for all applicants, Student for own application)
export const downloadApplicantResume = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('student', 'name email')
      .populate('studentProfile')
      .populate('drive');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application record not found.',
      });
    }

    // Access check: student can only download their own application resume
    if (
      req.user.role === 'student' &&
      application.student?._id?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only download your own application resume.',
      });
    }

    let resumeUrl =
      application.resumeSnapshot?.resumeUrl ||
      application.studentProfile?.resumeUrl;

    if (!resumeUrl && application.student) {
      const studentProfile = await StudentProfile.findOne({
        user: application.student._id || application.student,
      });
      if (studentProfile?.resumeUrl) {
        resumeUrl = studentProfile.resumeUrl;
      }
    }

    if (!resumeUrl) {
      return res.status(404).json({
        success: false,
        message: 'No resume document attached to this application or student profile.',
      });
    }

    const isInline =
      req.query.inline === 'true' ||
      req.query.preview === 'true' ||
      req.query.view === 'true';

    const candidateName = application.student?.name || 'Applicant';
    const originalName =
      application.resumeSnapshot?.resumeOriginalName ||
      application.studentProfile?.resumeOriginalName ||
      `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`;

    // Local file path resolution
    if (
      resumeUrl.startsWith('/uploads/') ||
      resumeUrl.startsWith('uploads/') ||
      resumeUrl.includes('resume-')
    ) {
      const filename = path.basename(resumeUrl);
      let filePath = path.join(__dirname, '../uploads/resumes', filename);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 100) {
        const altPath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(altPath) && fs.statSync(altPath).size >= 100) {
          filePath = altPath;
        } else {
          // Restore exact original PDF from MongoDB resumeData if available
          let base64Pdf = application.resumeSnapshot?.resumeData;
          if (!base64Pdf && application.studentProfile) {
            try {
              const sp = await StudentProfile.findById(application.studentProfile._id || application.studentProfile).select('+resumeData');
              base64Pdf = sp?.resumeData;
            } catch (err) {
              console.warn('Could not query StudentProfile for resume data:', err.message);
            }
          }

          if (base64Pdf) {
            try {
              const resumesDir = path.join(__dirname, '../uploads/resumes');
              if (!fs.existsSync(resumesDir)) {
                fs.mkdirSync(resumesDir, { recursive: true });
              }
              const buf = Buffer.from(base64Pdf, 'base64');
              fs.writeFileSync(filePath, buf);
            } catch (restoreErr) {
              console.error('Error restoring original resume PDF from MongoDB:', restoreErr);
            }
          }
        }
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).size >= 100) {
        if (isInline) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-Disposition',
            `inline; filename="${encodeURIComponent(originalName)}"`
          );
          return res.sendFile(filePath);
        }
        return res.download(filePath, originalName);
      }
    }

    // If external URL or static path
    return res.redirect(resumeUrl);
  } catch (error) {
    next(error);
  }
};

// Helper: Filter, Sort & Paginate applications array in memory
const filterSortPaginate = (applications, options) => {
  const {
    search = '',
    department = '',
    minCgpa = '',
    maxCgpa = '',
    status = '',
    aiFit = '',
    sortBy = 'appliedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = options;

  let filtered = [...applications];

  // 1. Status Filter
  if (status && status !== 'All') {
    filtered = filtered.filter((app) => app.status === status);
  }

  // 1b. AI Match Fit Filter
  if (aiFit && aiFit !== 'All') {
    filtered = filtered.filter((app) => app.aiScreening?.fitLevel === aiFit);
  }

  // 2. Department Filter
  if (department && department !== 'All') {
    const deptNorm = department.trim().toLowerCase();
    filtered = filtered.filter((app) => {
      const d1 = app.studentProfile?.department?.toLowerCase() || '';
      const d2 = app.resumeSnapshot?.studentDepartment?.toLowerCase() || '';
      return d1.includes(deptNorm) || d2.includes(deptNorm);
    });
  }

  // 3. CGPA Range Filter
  if (minCgpa !== '') {
    const min = Number(minCgpa);
    filtered = filtered.filter((app) => {
      const cgpa =
        app.studentProfile?.cgpa !== undefined
          ? app.studentProfile.cgpa
          : app.resumeSnapshot?.studentCgpa !== undefined
          ? app.resumeSnapshot.studentCgpa
          : 0;
      return cgpa >= min;
    });
  }

  if (maxCgpa !== '') {
    const max = Number(maxCgpa);
    filtered = filtered.filter((app) => {
      const cgpa =
        app.studentProfile?.cgpa !== undefined
          ? app.studentProfile.cgpa
          : app.resumeSnapshot?.studentCgpa !== undefined
          ? app.resumeSnapshot.studentCgpa
          : 0;
      return cgpa <= max;
    });
  }

  // 4. Keyword Search (Student Name, Roll Number, or Email)
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((app) => {
      const name = app.student?.name?.toLowerCase() || '';
      const email = app.student?.email?.toLowerCase() || '';
      const roll1 = app.studentProfile?.rollNumber?.toLowerCase() || '';
      const roll2 = app.resumeSnapshot?.studentRollNumber?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || roll1.includes(q) || roll2.includes(q);
    });
  }

  // 5. Sorting
  const isAsc = sortOrder === 'asc';
  filtered.sort((a, b) => {
    let valA, valB;

    switch (sortBy) {
      case 'aiScore':
      case 'aiMatch':
        valA = a.aiScreening?.score ?? -1;
        valB = b.aiScreening?.score ?? -1;
        return isAsc ? valA - valB : valB - valA;

      case 'cgpa':
        valA = a.studentProfile?.cgpa ?? a.resumeSnapshot?.studentCgpa ?? 0;
        valB = b.studentProfile?.cgpa ?? b.resumeSnapshot?.studentCgpa ?? 0;
        return isAsc ? valA - valB : valB - valA;

      case 'name':
        valA = (a.student?.name || '').toLowerCase();
        valB = (b.student?.name || '').toLowerCase();
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);

      case 'rollNumber':
        valA = (a.studentProfile?.rollNumber || a.resumeSnapshot?.studentRollNumber || '').toLowerCase();
        valB = (b.studentProfile?.rollNumber || b.resumeSnapshot?.studentRollNumber || '').toLowerCase();
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);

      case 'status':
        valA = (a.status || '').toLowerCase();
        valB = (b.status || '').toLowerCase();
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);

      case 'appliedAt':
      default:
        valA = new Date(a.appliedAt || 0).getTime();
        valB = new Date(b.appliedAt || 0).getTime();
        return isAsc ? valA - valB : valB - valA;
    }
  });

  // 6. Pagination
  const pageNum = Math.max(1, Number(page));
  const pageLimit = Math.max(1, Number(limit));
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageLimit) || 1;
  const startIndex = (pageNum - 1) * pageLimit;
  const paginated = filtered.slice(startIndex, startIndex + pageLimit);

  return {
    total,
    totalPages,
    currentPage: pageNum,
    paginated,
  };
};

// @desc    Get all applicants for a specific placement drive with search, filter, sort & pagination
// @route   GET /api/applications/drive/:driveId
// @access  Private (Officer only)
export const getDriveApplicants = async (req, res, next) => {
  try {
    const { driveId } = req.params;

    // Verify drive existence
    const drive = await PlacementDrive.findById(driveId).populate('company');
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found.',
      });
    }

    const applications = await Application.find({ drive: driveId })
      .populate('student', 'name email profilePhoto phone')
      .populate('studentProfile')
      .populate('company', 'name logoUrl industry')
      .populate('statusHistory.updatedBy', 'name email');

    const result = filterSortPaginate(applications, req.query);

    res.status(200).json({
      success: true,
      drive: {
        _id: drive._id,
        title: drive.title,
        jobRole: drive.jobRole,
        packageLPA: drive.packageLPA,
        status: drive.status,
        company: drive.company,
        applicationClosingDate: drive.applicationClosingDate,
        eligibilityCriteria: drive.eligibilityCriteria,
      },
      count: result.paginated.length,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      applications: result.paginated,
      applicants: result.paginated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications across drives managed by officer with filters, search, sort & pagination
// @route   GET /api/applications
// @access  Private (Officer only)
export const getAllApplications = async (req, res, next) => {
  try {
    const { driveId, companyId } = req.query;

    const filter = {};
    if (driveId) {
      filter.drive = driveId;
    }
    if (companyId) {
      filter.company = companyId;
    }

    const applications = await Application.find(filter)
      .populate('student', 'name email profilePhoto phone')
      .populate('studentProfile')
      .populate('company', 'name logoUrl industry')
      .populate('statusHistory.updatedBy', 'name email')
      .populate({
        path: 'drive',
        populate: { path: 'company', select: 'name industry logoUrl' },
      });

    const result = filterSortPaginate(applications, req.query);

    res.status(200).json({
      success: true,
      count: result.paginated.length,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      applications: result.paginated,
      applicants: result.paginated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update applicant selection status with history tracking (Officer only)
// @route   PATCH /api/applications/:id/status
// @access  Private (Officer only)
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, currentRound, officerNotes, selectionRemarks, feedback } = req.body;

    const application = await Application.findById(req.params.id)
      .populate({
        path: 'drive',
        populate: { path: 'company', select: 'name logo' },
      })
      .populate('company', 'name logo')
      .populate('student', '_id name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application record not found.',
      });
    }

    const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed statuses are: ${validStatuses.join(', ')}`,
      });
    }

    const previousStatus = application.status;
    const newStatus = status || previousStatus;

    // Record in status history
    application.statusHistory.push({
      previousStatus,
      newStatus,
      updatedBy: req.user._id,
      updatedDate: new Date(),
      remarks: selectionRemarks || officerNotes || `Status changed from ${previousStatus} to ${newStatus}.`,
    });

    if (status) application.status = newStatus;
    if (currentRound !== undefined && currentRound !== null) {
      application.currentRound = Number(currentRound);
    }
    if (officerNotes !== undefined) application.officerNotes = officerNotes;
    if (selectionRemarks !== undefined) application.selectionRemarks = selectionRemarks;
    if (feedback !== undefined) application.feedback = feedback;

    await application.save();

    // If marked Selected, update student's profile status and placedCompany
    if (newStatus === 'Selected') {
      await StudentProfile.findOneAndUpdate(
        { user: application.student._id },
        {
          placementStatus: 'Placed',
          placedCompany: application.company || application.drive?.company,
        }
      );
    }

    await application.populate('statusHistory.updatedBy', 'name email');

    // Enqueue durable outbox notification without waiting for SMTP (zero delay response)
    const remarks = selectionRemarks || officerNotes || feedback || '';
    const isStatusChanged = previousStatus !== newStatus;
    const isRemarksAdded = Boolean(remarks && remarks.trim());
    let emailQueueResult = null;

    if (isStatusChanged || isRemarksAdded) {
      try {
        emailQueueResult = await enqueueStatusUpdateNotification({
          application,
          previousStatus,
          newStatus,
          remarks,
          officer: req.user,
          clientRequestId: req.body.clientRequestId || null,
        });
      } catch (notifyErr) {
        console.error('[Application Status Notification Dispatch Error]:', notifyErr.message);
      }
    } else {
      emailQueueResult = { skipped: true, reason: 'STATUS_UNCHANGED' };
    }

    res.status(200).json({
      success: true,
      message: `Applicant status successfully updated to "${newStatus}".`,
      application,
      emailNotification: {
        status: emailQueueResult?.emailStatus || (emailQueueResult?.skipped ? 'skipped' : 'pending'),
        outboxId: emailQueueResult?.outboxId || null,
        recipient: emailQueueResult?.recipient || application.student?.email || null,
        skipped: Boolean(emailQueueResult?.skipped),
        message: emailQueueResult?.skipped
          ? 'Status unchanged. Redundant email was not sent.'
          : 'Status updated successfully. Email notification queued for delivery.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get email notification delivery status and history for an application
// @route   GET /api/applications/:id/email-status
// @access  Private (Officer only)
export const getApplicationEmailStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await getOutboxStatusForApplication(id);
    res.status(200).json({
      success: true,
      count: history.length,
      history,
      latestStatus: history[0]?.emailStatus || 'none',
      latestEvent: history[0] || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retry sending a failed email notification
// @route   POST /api/applications/notifications/:outboxId/retry
// @access  Private (Officer only)
export const retryApplicationEmail = async (req, res, next) => {
  try {
    const { outboxId } = req.params;
    const retried = await retryOutboxNotification(outboxId, req.user);
    res.status(200).json({
      success: true,
      message: 'Email notification retry scheduled successfully.',
      item: retried,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get status change history audit trail for an application
// @route   GET /api/applications/:id/history
// @access  Private (Student for own app, or Officer)
export const getApplicationStatusHistory = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('statusHistory.updatedBy', 'name email role')
      .populate('student', 'name email')
      .populate('drive', 'title jobRole');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application record not found.',
      });
    }

    // Role check: Students can only view history of their own applications
    if (req.user.role === 'student' && application.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view audit history for your own applications.',
      });
    }

    res.status(200).json({
      success: true,
      count: application.statusHistory?.length || 0,
      history: application.statusHistory || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run AI candidate screening for all applicants of a placement drive
// @route   POST /api/applications/drive/:driveId/ai-screen
// @access  Private (Officer only)
export const screenDriveApplicantsWithAI = async (req, res, next) => {
  try {
    const { driveId } = req.params;
    const drive = await PlacementDrive.findById(driveId).populate('company');
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive record not found.',
      });
    }

    const applications = await Application.find({ drive: driveId })
      .populate('student', 'name email profilePhoto phone')
      .populate('studentProfile')
      .populate('company', 'name logoUrl industry');

    if (applications.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No applicants have applied to this placement drive yet.',
        count: 0,
        averageScore: 0,
        topMatchesCount: 0,
        applications: [],
      });
    }

    let totalScore = 0;
    let topMatchesCount = 0;

    for (const app of applications) {
      const evaluation = await evaluateApplicantMatch({
        application: app,
        drive,
        profile: app.studentProfile,
        student: app.student,
      });

      app.aiScreening = evaluation;
      await app.save();

      totalScore += evaluation.score;
      if (evaluation.score >= 80) {
        topMatchesCount++;
      }
    }

    const averageScore = Math.round(totalScore / applications.length);

    res.status(200).json({
      success: true,
      message: `AI screening completed successfully for ${applications.length} candidate(s).`,
      count: applications.length,
      averageScore,
      topMatchesCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run AI candidate screening for a single application
// @route   POST /api/applications/:id/ai-screen
// @access  Private (Officer only)
export const screenSingleApplicationWithAI = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('drive')
      .populate('student', 'name email profilePhoto phone')
      .populate('studentProfile')
      .populate('company', 'name logoUrl industry');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application record not found.',
      });
    }

    // Permission check: Officers can screen any applicant. Students can only evaluate their own application.
    if (
      req.user &&
      req.user.role === 'student' &&
      application.student &&
      application.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only screen your own application.',
      });
    }

    const drive = application.drive;
    if (!drive) {
      return res.status(400).json({
        success: false,
        message: 'Associated placement drive details are missing.',
      });
    }

    const evaluation = await evaluateApplicantMatch({
      application,
      drive,
      profile: application.studentProfile,
      student: application.student,
    });

    application.aiScreening = evaluation;
    await application.save();

    res.status(200).json({
      success: true,
      message: 'AI candidate screening evaluation completed.',
      aiScreening: evaluation,
      application,
    });
  } catch (error) {
    next(error);
  }
};





