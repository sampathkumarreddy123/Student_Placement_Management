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

    const drive = await PlacementDrive.findById(driveId).populate('company');
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    // Check if student profile exists
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your student profile before applying.',
      });
    }

    // Check eligibility
    const { isEligible, reasons } = checkEligibility(profile, drive);
    if (!isEligible) {
      return res.status(400).json({
        success: false,
        message: 'You are not eligible for this drive.',
        reasons,
      });
    }

    // Check for existing application
    const existingApplication = await Application.findOne({
      student: req.user._id,
      drive: drive._id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this placement drive.',
      });
    }

    const application = await Application.create({
      student: req.user._id,
      studentProfile: profile._id,
      drive: drive._id,
      status: 'Applied',
      currentRound: 1,
    });

    res.status(201).json({
      success: true,
      message: `Successfully applied to ${drive.company?.name || 'the drive'} for role ${drive.jobRole}!`,
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
    const applications = await Application.find({ student: req.user._id })
      .populate({
        path: 'drive',
        populate: { path: 'company', select: 'name industry location website' },
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
    const { status, driveId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (driveId) filter.drive = driveId;

    const applications = await Application.find(filter)
      .populate('student', 'name email')
      .populate('studentProfile')
      .populate({
        path: 'drive',
        populate: { path: 'company', select: 'name industry' },
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

// @desc    Update applicant status (Officer only)
// @route   PATCH /api/applications/:id/status
// @access  Private (Officer only)
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, currentRound, officerNotes, feedback } = req.body;

    const application = await Application.findById(req.params.id)
      .populate('drive')
      .populate('student');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (status) application.status = status;
    if (currentRound !== undefined) application.currentRound = Number(currentRound);
    if (officerNotes !== undefined) application.officerNotes = officerNotes;
    if (feedback !== undefined) application.feedback = feedback;

    await application.save();

    // If marked Selected, update student's profile status and placedCompany
    if (status === 'Selected') {
      await StudentProfile.findOneAndUpdate(
        { user: application.student._id },
        {
          placementStatus: 'Placed',
          placedCompany: application.drive.company,
        }
      );
    }

    res.status(200).json({
      success: true,
      message: `Applicant status updated to ${status || 'new round'}`,
      application,
    });
  } catch (error) {
    next(error);
  }
};

