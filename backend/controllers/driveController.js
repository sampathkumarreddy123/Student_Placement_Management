import PlacementDrive from '../models/PlacementDrive.js';
import StudentProfile from '../models/StudentProfile.js';
import Application from '../models/Application.js';
import { checkEligibility } from '../services/eligibilityService.js';

// @desc    Get all placement drives with eligibility status if student
// @route   GET /api/drives
// @access  Private
export const getDrives = async (req, res, next) => {
  try {
    const { status, search, minPackage, department } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (minPackage) {
      filter.packageLPA = { $gte: Number(minPackage) };
    }

    if (department) {
      filter['eligibilityCriteria.allowedDepartments'] = { $in: [department] };
    }

    let drives = await PlacementDrive.find(filter)
      .populate('company', 'name industry location website logoUrl')
      .sort({ driveDate: 1 });

    if (search) {
      const q = search.toLowerCase();
      drives = drives.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.jobRole.toLowerCase().includes(q) ||
          d.company?.name.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q)
      );
    }

    // If current user is a student, attach their application status & eligibility info
    if (req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: req.user._id });
      const userApplications = await Application.find({ student: req.user._id }).select('drive status');

      const appMap = new Map();
      userApplications.forEach((app) => appMap.set(app.drive.toString(), app.status));

      const enrichedDrives = drives.map((drive) => {
        const driveObj = drive.toObject();
        const eligibility = checkEligibility(profile, drive);

        return {
          ...driveObj,
          userApplicationStatus: appMap.get(drive._id.toString()) || null,
          isEligible: eligibility.isEligible,
          eligibilityReasons: eligibility.reasons,
        };
      });

      return res.status(200).json({
        success: true,
        count: enrichedDrives.length,
        drives: enrichedDrives,
      });
    }

    // For officers, return drives with applicant count
    const enrichedWithCounts = await Promise.all(
      drives.map(async (drive) => {
        const applicantCount = await Application.countDocuments({ drive: drive._id });
        return {
          ...drive.toObject(),
          applicantCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedWithCounts.length,
      drives: enrichedWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get drive by ID
// @route   GET /api/drives/:id
// @access  Private
export const getDriveById = async (req, res, next) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id)
      .populate('company')
      .populate('createdBy', 'name email');

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    let responseData = drive.toObject();

    if (req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: req.user._id });
      const userApplication = await Application.findOne({
        student: req.user._id,
        drive: drive._id,
      });

      const eligibility = checkEligibility(profile, drive);

      responseData.userApplication = userApplication;
      responseData.isEligible = eligibility.isEligible;
      responseData.eligibilityReasons = eligibility.reasons;
    } else {
      // For officer, get breakdown of applications
      const applicantCount = await Application.countDocuments({ drive: drive._id });
      const selectedCount = await Application.countDocuments({
        drive: drive._id,
        status: 'Selected',
      });
      responseData.applicantCount = applicantCount;
      responseData.selectedCount = selectedCount;
    }

    res.status(200).json({
      success: true,
      drive: responseData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a placement drive
// @route   POST /api/drives
// @access  Private (Officer only)
export const createDrive = async (req, res, next) => {
  try {
    const {
      company,
      title,
      jobRole,
      description,
      packageLPA,
      location,
      eligibilityCriteria,
      driveDate,
      registrationDeadline,
      rounds,
      status,
    } = req.body;

    if (!company || !title || !jobRole || !packageLPA || !driveDate || !registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all mandatory drive details.',
      });
    }

    const drive = await PlacementDrive.create({
      company,
      title,
      jobRole,
      description,
      packageLPA: Number(packageLPA),
      location: location || 'Campus / Virtual',
      eligibilityCriteria: eligibilityCriteria || {},
      driveDate,
      registrationDeadline,
      rounds: rounds && rounds.length > 0 ? rounds : [
        { roundNumber: 1, roundName: 'Online Assessment', description: 'Technical & Aptitude test' },
        { roundNumber: 2, roundName: 'Technical Interview', description: 'Core problem solving & system design' },
        { roundNumber: 3, roundName: 'HR & Final Interview', description: 'Behavioral & cultural fit' },
      ],
      status: status || 'Upcoming',
      createdBy: req.user._id,
    });

    const populatedDrive = await PlacementDrive.findById(drive._id).populate('company');

    res.status(201).json({
      success: true,
      message: 'Placement drive created successfully',
      drive: populatedDrive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a placement drive
// @route   PUT /api/drives/:id
// @access  Private (Officer only)
export const updateDrive = async (req, res, next) => {
  try {
    const drive = await PlacementDrive.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('company');

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Placement drive updated successfully',
      drive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a placement drive
// @route   DELETE /api/drives/:id
// @access  Private (Officer only)
export const deleteDrive = async (req, res, next) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    // Delete associated applications
    await Application.deleteMany({ drive: drive._id });
    await drive.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Placement drive and associated applications deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

