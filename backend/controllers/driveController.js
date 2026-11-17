import mongoose from 'mongoose';
import PlacementDrive from '../models/PlacementDrive.js';
import RecruitmentRound from '../models/RecruitmentRound.js';
import Company from '../models/Company.js';
import StudentProfile from '../models/StudentProfile.js';
import Application from '../models/Application.js';
import { checkEligibility } from '../services/eligibilityService.js';
import { notifyStudentsOnDrivePublished } from '../services/notificationService.js';

// @desc    Get all placement drives with eligibility status if student
// @route   GET /api/drives
// @access  Private
export const getDrives = async (req, res, next) => {
  try {
    const { status, search, minPackage, department, company, jobRole, eligibleOnly } = req.query;
    const filter = {};

    // STUDENT VISIBILITY RULE: Students strictly only see Published drives (or ongoing/upcoming legacy)
    if (req.user.role === 'student') {
      filter.status = { $in: ['Published', 'Upcoming', 'Ongoing'] };
    } else if (status && status !== 'All') {
      filter.status = status;
    }

    if (minPackage) {
      filter.packageLPA = { $gte: Number(minPackage) };
    }

    if (department && department !== 'All') {
      filter['eligibilityCriteria.allowedDepartments'] = { $in: [department] };
    }

    if (company && company !== 'All') {
      if (mongoose.isValidObjectId(company)) {
        filter.company = company;
      }
    }

    if (jobRole && jobRole !== 'All') {
      filter.jobRole = { $regex: jobRole, $options: 'i' };
    }

    let drives = await PlacementDrive.find(filter)
      .populate('company', 'name industry location website logoUrl')
      .sort({ createdAt: -1, applicationClosingDate: 1 });

    if (company && company !== 'All' && !mongoose.isValidObjectId(company)) {
      const cLower = company.toLowerCase();
      drives = drives.filter((d) => d.company?.name?.toLowerCase().includes(cLower));
    }

    if (search) {
      const q = search.toLowerCase();
      drives = drives.filter(
        (d) =>
          d.title?.toLowerCase().includes(q) ||
          d.jobRole?.toLowerCase().includes(q) ||
          d.company?.name?.toLowerCase().includes(q) ||
          d.location?.toLowerCase().includes(q) ||
          (d.requiredSkills && d.requiredSkills.some((s) => s.toLowerCase().includes(q)))
      );
    }

    // If current user is a student, attach their application status & eligibility info
    if (req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: req.user._id });
      const userApplications = await Application.find({ student: req.user._id }).select('drive status');

      const appMap = new Map();
      userApplications.forEach((app) => appMap.set(app.drive.toString(), app.status));

      let enrichedDrives = drives.map((drive) => {
        const driveObj = drive.toObject();
        const eligibility = checkEligibility(profile, drive);

        return {
          ...driveObj,
          userApplicationStatus: appMap.get(drive._id.toString()) || null,
          isEligible: eligibility.isEligible,
          eligibilityReasons: eligibility.reasons,
          eligibilityDetails: eligibility.criteriaDetails,
          hasIncompleteProfile: eligibility.hasIncompleteProfile,
          missingProfileFields: eligibility.missingProfileFields,
          eligibilitySummary: eligibility.summary,
        };
      });

      if (eligibleOnly === 'true' || eligibleOnly === true) {
        enrichedDrives = enrichedDrives.filter((d) => d.isEligible);
      }

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

    // Students cannot view Draft drives
    if (req.user.role === 'student' && drive.status === 'Draft') {
      return res.status(403).json({
        success: false,
        message: 'This placement drive is in draft mode and not accessible.',
      });
    }

    let responseData = drive.toObject();

    const recruitmentRounds = await RecruitmentRound.find({ drive: drive._id }).sort({ roundNumber: 1 });
    if (recruitmentRounds.length > 0) {
      responseData.rounds = recruitmentRounds.map((r) => ({
        _id: r._id,
        roundNumber: r.roundNumber,
        roundName: r.name,
        name: r.name,
        description: r.description,
        date: r.date,
        mode: r.mode,
        venue: r.venue,
        isFinalRound: r.isFinalRound,
        status: r.status,
      }));
    }

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
      responseData.eligibilityDetails = eligibility.criteriaDetails;
      responseData.hasIncompleteProfile = eligibility.hasIncompleteProfile;
      responseData.missingProfileFields = eligibility.missingProfileFields;
      responseData.eligibilitySummary = eligibility.summary;
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
      jobDescription,
      description,
      packageLPA,
      location,
      employmentType,
      vacancies,
      requiredSkills,
      eligibilityCriteria,
      applicationOpeningDate,
      applicationClosingDate,
      driveDate,
      registrationDeadline,
      rounds,
      status,
    } = req.body;

    // 1. Mandatory validation
    if (!company || !jobRole || packageLPA === undefined || packageLPA === null) {
      return res.status(400).json({
        success: false,
        message: 'Please provide company, job role, and package (CTC).',
      });
    }

    // 2. Validate company exists
    const companyDoc = await Company.findById(company);
    if (!companyDoc) {
      return res.status(400).json({
        success: false,
        message: 'Selected company does not exist in the database.',
      });
    }

    // 3. Date validation
    const opening = applicationOpeningDate ? new Date(applicationOpeningDate) : new Date();
    const closing = applicationClosingDate
      ? new Date(applicationClosingDate)
      : registrationDeadline
      ? new Date(registrationDeadline)
      : null;

    if (!closing || isNaN(closing.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Valid application closing date is required.',
      });
    }

    if (closing <= opening) {
      return res.status(400).json({
        success: false,
        message: 'Application closing date must be strictly after the opening date.',
      });
    }

    // 4. Numerical range validations
    const numPackage = Number(packageLPA);
    if (isNaN(numPackage) || numPackage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Package (LPA) must be a non-negative number.',
      });
    }

    const minCgpa = eligibilityCriteria?.minCgpa !== undefined ? Number(eligibilityCriteria.minCgpa) : 6.0;
    if (isNaN(minCgpa) || minCgpa < 0 || minCgpa > 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum CGPA must be between 0 and 10.',
      });
    }

    const minTenth =
      eligibilityCriteria?.minTenthPercentage !== undefined ? Number(eligibilityCriteria.minTenthPercentage) : 60;
    if (isNaN(minTenth) || minTenth < 0 || minTenth > 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum 10th percentage must be between 0 and 100.',
      });
    }

    const minTwelfth =
      eligibilityCriteria?.minTwelfthPercentage !== undefined ? Number(eligibilityCriteria.minTwelfthPercentage) : 60;
    if (isNaN(minTwelfth) || minTwelfth < 0 || minTwelfth > 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum Intermediate/Diploma percentage must be between 0 and 100.',
      });
    }

    const maxActiveBacklogs =
      eligibilityCriteria?.maxActiveBacklogs !== undefined
        ? Number(eligibilityCriteria.maxActiveBacklogs)
        : eligibilityCriteria?.maxBacklogs !== undefined
        ? Number(eligibilityCriteria.maxBacklogs)
        : 0;

    const maxTotalBacklogs =
      eligibilityCriteria?.maxTotalBacklogs !== undefined
        ? Number(eligibilityCriteria.maxTotalBacklogs)
        : maxActiveBacklogs;

    if (maxActiveBacklogs < 0 || maxTotalBacklogs < 0) {
      return res.status(400).json({
        success: false,
        message: 'Backlog limits cannot be negative.',
      });
    }

    // Process skills
    let parsedSkills = [];
    if (Array.isArray(requiredSkills)) {
      parsedSkills = requiredSkills.map((s) => s.trim()).filter(Boolean);
    } else if (typeof requiredSkills === 'string') {
      parsedSkills = requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Auto title if omitted
    const driveTitle = title?.trim() || `${companyDoc.name} - ${jobRole}`;
    const driveDesc = (jobDescription || description || '').trim();

    // Default rounds if none provided
    const driveRounds =
      rounds && rounds.length > 0
        ? rounds
        : [
            { roundNumber: 1, roundName: 'Online Assessment', description: 'Technical & Aptitude test' },
            { roundNumber: 2, roundName: 'Technical Interview', description: 'Problem solving & core domain' },
            { roundNumber: 3, roundName: 'HR & Final Interview', description: 'Behavioral & cultural fit' },
          ];

    const drive = await PlacementDrive.create({
      company,
      title: driveTitle,
      jobRole: jobRole.trim(),
      jobDescription: driveDesc,
      description: driveDesc,
      packageLPA: numPackage,
      location: location?.trim() || 'Campus / Virtual',
      employmentType: employmentType || 'Full-Time',
      vacancies: vacancies ? Math.max(1, Number(vacancies)) : 5,
      requiredSkills: parsedSkills,
      eligibilityCriteria: {
        minCgpa,
        minTenthPercentage: minTenth,
        minTwelfthPercentage: minTwelfth,
        allowedDepartments: eligibilityCriteria?.allowedDepartments || [
          'Computer Science',
          'Information Technology',
          'Electronics & Communication',
          'Electrical Engineering',
        ],
        batch: eligibilityCriteria?.batch ? Number(eligibilityCriteria.batch) : 2026,
        maxActiveBacklogs,
        maxTotalBacklogs,
        maxBacklogs: maxActiveBacklogs,
      },
      applicationOpeningDate: opening,
      applicationClosingDate: closing,
      registrationDeadline: closing,
      driveDate: driveDate ? new Date(driveDate) : new Date(closing.getTime() + 7 * 86400000),
      rounds: driveRounds,
      status: status || 'Draft',
      createdBy: req.user._id,
    });

    const populatedDrive = await PlacementDrive.findById(drive._id).populate('company');

    if (drive.status === 'Published') {
      notifyStudentsOnDrivePublished(populatedDrive).catch((err) =>
        console.error('Failed to notify students on drive creation:', err)
      );
    }

    res.status(201).json({
      success: true,
      message: `Placement drive "${drive.title}" created successfully as ${drive.status}`,
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
    const existing = await PlacementDrive.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    const updates = { ...req.body };

    // If company changed, verify existence
    if (updates.company && updates.company !== existing.company.toString()) {
      const comp = await Company.findById(updates.company);
      if (!comp) {
        return res.status(400).json({
          success: false,
          message: 'Selected company does not exist',
        });
      }
    }

    // Validate dates if modified
    const opening = updates.applicationOpeningDate
      ? new Date(updates.applicationOpeningDate)
      : existing.applicationOpeningDate;
    const closing = updates.applicationClosingDate
      ? new Date(updates.applicationClosingDate)
      : updates.registrationDeadline
      ? new Date(updates.registrationDeadline)
      : existing.applicationClosingDate;

    if (closing && opening && new Date(closing) <= new Date(opening)) {
      return res.status(400).json({
        success: false,
        message: 'Application closing date must be strictly after the opening date.',
      });
    }

    if (updates.applicationClosingDate) {
      updates.registrationDeadline = updates.applicationClosingDate;
    } else if (updates.registrationDeadline) {
      updates.applicationClosingDate = updates.registrationDeadline;
    }

    if (updates.jobDescription && !updates.description) {
      updates.description = updates.jobDescription;
    } else if (updates.description && !updates.jobDescription) {
      updates.jobDescription = updates.description;
    }

    // Skills handling
    if (typeof updates.requiredSkills === 'string') {
      updates.requiredSkills = updates.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Backlog sync
    if (updates.eligibilityCriteria) {
      if (updates.eligibilityCriteria.maxActiveBacklogs !== undefined) {
        updates.eligibilityCriteria.maxBacklogs = updates.eligibilityCriteria.maxActiveBacklogs;
      } else if (updates.eligibilityCriteria.maxBacklogs !== undefined) {
        updates.eligibilityCriteria.maxActiveBacklogs = updates.eligibilityCriteria.maxBacklogs;
      }
    }

    const drive = await PlacementDrive.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('company');

    if (existing.status !== 'Published' && drive.status === 'Published') {
      notifyStudentsOnDrivePublished(drive).catch((err) =>
        console.error('Failed to notify students on updateDrive publish:', err)
      );
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

// @desc    Publish a placement drive (makes visible to students)
// @route   PATCH /api/drives/:id/publish
// @access  Private (Officer only)
export const publishDrive = async (req, res, next) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    drive.status = 'Published';
    await drive.save();

    const populated = await PlacementDrive.findById(drive._id).populate('company');

    notifyStudentsOnDrivePublished(populated).catch((err) =>
      console.error('Failed to notify students on publishDrive:', err)
    );

    res.status(200).json({
      success: true,
      message: `Drive "${drive.title}" is now Published and visible to eligible students.`,
      drive: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close applications for a placement drive
// @route   PATCH /api/drives/:id/close
// @access  Private (Officer only)
export const closeDrive = async (req, res, next) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    drive.status = 'Closed';
    await drive.save();

    const populated = await PlacementDrive.findById(drive._id).populate('company');

    res.status(200).json({
      success: true,
      message: `Applications for drive "${drive.title}" have been closed.`,
      drive: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive / Mark completed a placement drive
// @route   PATCH /api/drives/:id/archive
// @access  Private (Officer only)
export const archiveDrive = async (req, res, next) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found',
      });
    }

    drive.status = 'Completed';
    await drive.save();

    const populated = await PlacementDrive.findById(drive._id).populate('company');

    res.status(200).json({
      success: true,
      message: `Placement drive "${drive.title}" has been archived as Completed.`,
      drive: populated,
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


