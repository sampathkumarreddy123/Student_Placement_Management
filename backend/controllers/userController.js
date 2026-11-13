import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Application from '../models/Application.js';
import PlacementDrive from '../models/PlacementDrive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper to calculate dynamic profile completion percentage
 */
export const calculateProfileCompletion = (user, profile) => {
  let score = 0;
  const items = [];

  // 1. Basic Info (Name, Email, Roll)
  const hasBasic = Boolean(user.name && user.email && profile.rollNumber);
  items.push({
    key: 'basic',
    label: 'Identification (Name, Email, Roll Number)',
    completed: hasBasic,
    points: 20,
  });
  if (hasBasic) score += 20;

  // 2. Phone Contact
  const hasPhone = Boolean(profile.phone && profile.phone.trim().length >= 8);
  items.push({
    key: 'phone',
    label: 'Contact Phone Number',
    completed: hasPhone,
    points: 10,
  });
  if (hasPhone) score += 10;

  // 3. Department & Batch
  const hasDept = Boolean(profile.department && profile.batch);
  items.push({
    key: 'dept',
    label: 'Department & Graduation Batch',
    completed: hasDept,
    points: 10,
  });
  if (hasDept) score += 10;

  // 4. CGPA
  const hasCgpa = typeof profile.cgpa === 'number' && profile.cgpa > 0;
  items.push({
    key: 'cgpa',
    label: 'Current Academic CGPA',
    completed: hasCgpa,
    points: 15,
  });
  if (hasCgpa) score += 15;

  // 5. Schooling percentages (10th & 12th/Diploma)
  const hasSchooling =
    typeof profile.tenthPercentage === 'number' &&
    profile.tenthPercentage > 0 &&
    typeof profile.twelfthPercentage === 'number' &&
    profile.twelfthPercentage > 0;
  items.push({
    key: 'schooling',
    label: '10th & 12th / Diploma Percentages',
    completed: hasSchooling,
    points: 15,
  });
  if (hasSchooling) score += 15;

  // 6. Skills
  const hasSkills = Array.isArray(profile.skills) && profile.skills.length > 0;
  items.push({
    key: 'skills',
    label: 'Technical Skills Portfolio',
    completed: hasSkills,
    points: 10,
  });
  if (hasSkills) score += 10;

  // 7. Resume
  const hasResume = Boolean(profile.resumeUrl);
  items.push({
    key: 'resume',
    label: 'PDF Resume Document Uploaded',
    completed: hasResume,
    points: 15,
  });
  if (hasResume) score += 15;

  // 8. Professional links
  const hasSocial = Boolean(profile.linkedinUrl || profile.githubUrl);
  items.push({
    key: 'social',
    label: 'LinkedIn or GitHub Profile Link',
    completed: hasSocial,
    points: 5,
  });
  if (hasSocial) score += 5;

  return {
    percentage: Math.min(score, 100),
    items,
  };
};

// @desc    Get logged-in student profile with completion analysis
// @route   GET /api/users/profile
// @access  Private (Student)
export const getMyProfile = async (req, res, next) => {
  try {
    let profile = await StudentProfile.findOne({ user: req.user._id }).populate(
      'placedCompany',
      'name industry website'
    );

    if (!profile) {
      profile = await StudentProfile.create({
        user: req.user._id,
        rollNumber: `STU-${Date.now().toString().slice(-6)}`,
        department: 'Computer Science',
        batch: new Date().getFullYear(),
        cgpa: 0,
      });
    }

    const completion = calculateProfileCompletion(req.user, profile);

    res.status(200).json({
      success: true,
      profile: {
        ...profile.toObject(),
        name: req.user.name,
        email: req.user.email,
        profilePhoto: req.user.profilePhoto || profile.profilePhoto || '',
      },
      completion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student profile
// @route   PUT /api/users/profile
// @access  Private (Student)
export const updateMyProfile = async (req, res, next) => {
  try {
    const {
      name,
      department,
      batch,
      cgpa,
      activeBacklogs,
      totalBacklogs,
      backlogs,
      tenthPercentage,
      twelfthPercentage,
      phone,
      githubUrl,
      linkedinUrl,
      skills,
      profilePhoto,
    } = req.body;

    let profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
      });
    }

    // Validation: CGPA
    if (cgpa !== undefined) {
      const numCgpa = Number(cgpa);
      if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
        return res.status(400).json({
          success: false,
          message: 'CGPA must be a valid number between 0 and 10.',
        });
      }
      profile.cgpa = numCgpa;
    }

    // Validation: Percentages
    if (tenthPercentage !== undefined) {
      const num10th = Number(tenthPercentage);
      if (isNaN(num10th) || num10th < 0 || num10th > 100) {
        return res.status(400).json({
          success: false,
          message: '10th percentage must be between 0 and 100.',
        });
      }
      profile.tenthPercentage = num10th;
    }

    if (twelfthPercentage !== undefined) {
      const num12th = Number(twelfthPercentage);
      if (isNaN(num12th) || num12th < 0 || num12th > 100) {
        return res.status(400).json({
          success: false,
          message: '12th / Diploma percentage must be between 0 and 100.',
        });
      }
      profile.twelfthPercentage = num12th;
    }

    // Validation: Backlogs
    if (activeBacklogs !== undefined || backlogs !== undefined) {
      const b = Number(activeBacklogs !== undefined ? activeBacklogs : backlogs);
      if (isNaN(b) || b < 0) {
        return res.status(400).json({
          success: false,
          message: 'Active backlogs cannot be negative.',
        });
      }
      profile.activeBacklogs = b;
      profile.backlogs = b;
    }

    if (totalBacklogs !== undefined) {
      const tb = Number(totalBacklogs);
      if (isNaN(tb) || tb < 0) {
        return res.status(400).json({
          success: false,
          message: 'Total backlogs cannot be negative.',
        });
      }
      profile.totalBacklogs = tb;
    }

    // Validation: URLs
    const urlPattern = /^https?:\/\/.+/i;
    if (githubUrl !== undefined) {
      if (githubUrl && !urlPattern.test(githubUrl.trim())) {
        return res.status(400).json({
          success: false,
          message: 'GitHub profile URL must start with http:// or https://',
        });
      }
      profile.githubUrl = githubUrl ? githubUrl.trim() : '';
    }

    if (linkedinUrl !== undefined) {
      if (linkedinUrl && !urlPattern.test(linkedinUrl.trim())) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn profile URL must start with http:// or https://',
        });
      }
      profile.linkedinUrl = linkedinUrl ? linkedinUrl.trim() : '';
    }

    // Other fields (Note: rollNumber and email are strictly ignored/prevented from editing)
    if (department !== undefined) profile.department = department.trim();
    if (batch !== undefined) profile.batch = Number(batch);
    if (phone !== undefined) profile.phone = phone.trim();
    if (profilePhoto !== undefined) profile.profilePhoto = profilePhoto;

    if (skills !== undefined) {
      profile.skills = Array.isArray(skills)
        ? skills.map((s) => s.trim()).filter(Boolean)
        : skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }

    await profile.save();

    // Update full name in User record if changed
    let updatedUser = req.user;
    if (name && name.trim() && name.trim() !== req.user.name) {
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { name: name.trim() },
        { new: true }
      );
    }

    const completion = calculateProfileCompletion(updatedUser, profile);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      profile: {
        ...profile.toObject(),
        name: updatedUser.name,
        email: updatedUser.email,
        profilePhoto: updatedUser.profilePhoto || profile.profilePhoto || '',
      },
      completion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload student resume (PDF only, max 5MB)
// @route   POST /api/users/profile/resume
// @access  Private (Student)
export const uploadResumeFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please choose a PDF resume file to upload.',
      });
    }

    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
      });
    }

    // Clean up previous resume file if it was stored locally
    if (profile.resumeUrl && profile.resumeUrl.startsWith('/uploads/resumes/')) {
      const oldFilename = profile.resumeUrl.replace('/uploads/resumes/', '');
      const oldPath = path.join(__dirname, '../uploads/resumes', oldFilename);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.warn('Could not remove previous resume file:', e.message);
        }
      }
    }

    // Save relative URL path and metadata
    profile.resumeUrl = `/uploads/resumes/${req.file.filename}`;
    profile.resumeOriginalName = req.file.originalname;
    profile.resumeSize = req.file.size;
    profile.resumeUpdatedAt = new Date();

    await profile.save();

    const completion = calculateProfileCompletion(req.user, profile);

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully!',
      resume: {
        url: profile.resumeUrl,
        originalName: profile.resumeOriginalName,
        size: profile.resumeSize,
        updatedAt: profile.resumeUpdatedAt,
      },
      completion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download student resume
// @route   GET /api/users/profile/resume/download
// @access  Private (Student)
export const downloadResumeFile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile || !profile.resumeUrl) {
      return res.status(404).json({
        success: false,
        message: 'No resume has been uploaded yet.',
      });
    }

    if (profile.resumeUrl.startsWith('/uploads/resumes/')) {
      const filename = profile.resumeUrl.replace('/uploads/resumes/', '');
      const filePath = path.join(__dirname, '../uploads/resumes', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Resume file not found on disk.',
        });
      }

      const downloadName =
        profile.resumeOriginalName || `${req.user.name.replace(/\s+/g, '_')}_Resume.pdf`;
      return res.download(filePath, downloadName);
    }

    // If external URL
    return res.redirect(profile.resumeUrl);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload student profile photo / avatar
// @route   POST /api/users/profile/avatar
// @access  Private (Student)
export const uploadAvatarFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image file (JPG, PNG, WebP).',
      });
    }

    const photoUrl = `/uploads/avatars/${req.file.filename}`;

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { profilePhoto: photoUrl }),
      StudentProfile.findOneAndUpdate({ user: req.user._id }, { profilePhoto: photoUrl }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully!',
      profilePhoto: photoUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all students (Officer only)
// @route   GET /api/users/students
// @access  Private (Officer)
export const getAllStudents = async (req, res, next) => {
  try {
    const { department, batch, minCgpa, placementStatus, search } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (batch) filter.batch = Number(batch);
    if (minCgpa) filter.cgpa = { $gte: Number(minCgpa) };
    if (placementStatus) filter.placementStatus = placementStatus;

    let profiles = await StudentProfile.find(filter)
      .populate('user', 'name email isActive createdAt profilePhoto')
      .populate('placedCompany', 'name')
      .sort({ createdAt: -1 });

    if (search) {
      const q = search.toLowerCase();
      profiles = profiles.filter((p) => {
        return (
          p.user?.name?.toLowerCase().includes(q) ||
          p.user?.email?.toLowerCase().includes(q) ||
          p.rollNumber?.toLowerCase().includes(q)
        );
      });
    }

    res.status(200).json({
      success: true,
      count: profiles.length,
      students: profiles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student stats (Officer only)
// @route   GET /api/users/stats
// @access  Private (Officer)
export const getPlacementStats = async (req, res, next) => {
  try {
    const totalStudents = await StudentProfile.countDocuments();
    const placedStudents = await StudentProfile.countDocuments({ placementStatus: 'Placed' });
    const unplacedStudents = totalStudents - placedStudents;
    const totalDrives = await PlacementDrive.countDocuments();
    const activeDrives = await PlacementDrive.countDocuments({
      status: { $in: ['Upcoming', 'Ongoing'] },
    });
    const totalApplications = await Application.countDocuments();

    // Department breakdown
    const deptStats = await StudentProfile.aggregate([
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

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        placedStudents,
        unplacedStudents,
        placementRate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
        totalDrives,
        activeDrives,
        totalApplications,
        deptStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
