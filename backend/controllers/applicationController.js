import Application from '../models/Application.js';
import PlacementDrive from '../models/PlacementDrive.js';
import StudentProfile from '../models/StudentProfile.js';
import { checkEligibility } from '../services/eligibilityService.js';

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

    // 4. Check if student profile exists
    const profile = await StudentProfile.findOne({ user: req.user._id });
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
    const application = await Application.create({
      student: req.user._id,
      company: drive.company?._id || drive.company,
      drive: drive._id,
      studentProfile: profile._id,
      appliedAt: new Date(),
      status: 'Applied',
      currentRound: 1,
      resumeSnapshot: {
        resumeUrl: resumeUrl,
        resumeOriginalName: profile.resumeOriginalName || profile.resume?.originalName || 'Resume.pdf',
        resumeSize: profile.resumeSize || profile.resume?.fileSize || 0,
        studentCgpa: studentCgpa,
        studentDepartment: department,
        studentRollNumber: rollNumber,
        skills: profile.skills || [],
      },
      selectionRemarks: '',
      officerNotes: '',
    });

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
      .populate('student', 'name email')
      .populate('studentProfile')
      .populate('company', 'name industry location website logoUrl contactEmail')
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

// @desc    Get all applications for a drive (Officer only)
// @route   GET /api/applications/drive/:driveId
// @access  Private (Officer only)
export const getDriveApplicants = async (req, res, next) => {
  try {
    const { driveId } = req.params;
    const { status } = req.query;

    const filter = { drive: driveId };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('student', 'name email')
      .populate('studentProfile')
      .populate('company', 'name logoUrl industry')
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

// @desc    Get all applications across system with filters (Officer only)
// @route   GET /api/applications
// @access  Private (Officer only)
export const getAllApplications = async (req, res, next) => {
  try {
    const { status, driveId, companyId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (driveId) filter.drive = driveId;
    if (companyId) filter.company = companyId;

    const applications = await Application.find(filter)
      .populate('student', 'name email')
      .populate('studentProfile')
      .populate('company', 'name logoUrl industry')
      .populate({
        path: 'drive',
        populate: { path: 'company', select: 'name industry logoUrl' },
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

// @desc    Update applicant status and selection remarks (Officer only)
// @route   PATCH /api/applications/:id/status
// @access  Private (Officer only)
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, currentRound, officerNotes, selectionRemarks, feedback } = req.body;

    const application = await Application.findById(req.params.id)
      .populate('drive')
      .populate('student');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    if (status) application.status = status;
    if (currentRound !== undefined) application.currentRound = Number(currentRound);
    if (officerNotes !== undefined) application.officerNotes = officerNotes;
    if (selectionRemarks !== undefined) application.selectionRemarks = selectionRemarks;
    if (feedback !== undefined) application.feedback = feedback;

    await application.save();

    // If marked Selected, update student's profile status and placedCompany
    if (status === 'Selected') {
      await StudentProfile.findOneAndUpdate(
        { user: application.student._id },
        {
          placementStatus: 'Placed',
          placedCompany: application.company || application.drive?.company,
        }
      );
    }

    res.status(200).json({
      success: true,
      message: `Applicant status updated to "${status || 'Updated'}" successfully.`,
      application,
    });
  } catch (error) {
    next(error);
  }
};


