import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Application from '../models/Application.js';
import PlacementDrive from '../models/PlacementDrive.js';

// @desc    Get or update student profile
// @route   GET /api/users/profile
// @access  Private (Student)
export const getMyProfile = async (req, res, next) => {
  try {
    let profile = await StudentProfile.findOne({ user: req.user._id }).populate(
      'placedCompany',
      'name industry website'
    );

    if (!profile) {
      // Auto-create blank profile if not existing
      profile = await StudentProfile.create({
        user: req.user._id,
        rollNumber: `STU-${Date.now().toString().slice(-6)}`,
        department: 'Computer Science',
        batch: new Date().getFullYear(),
        cgpa: 7.0,
      });
    }

    res.status(200).json({
      success: true,
      profile: {
        ...profile.toObject(),
        name: req.user.name,
        email: req.user.email,
      },
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
      rollNumber,
      department,
      batch,
      cgpa,
      backlogs,
      tenthPercentage,
      twelfthPercentage,
      phone,
      resumeUrl,
      skills,
    } = req.body;

    let profile = await StudentProfile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new StudentProfile({ user: req.user._id });
    }

    // Check if new rollNumber collides with another student
    if (rollNumber && rollNumber.toUpperCase() !== profile.rollNumber) {
      const exists = await StudentProfile.findOne({
        rollNumber: rollNumber.toUpperCase(),
        user: { $ne: req.user._id },
      });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Roll number is already in use by another student',
        });
      }
      profile.rollNumber = rollNumber.toUpperCase();
    }

    if (department !== undefined) profile.department = department;
    if (batch !== undefined) profile.batch = Number(batch);
    if (cgpa !== undefined) profile.cgpa = Number(cgpa);
    if (backlogs !== undefined) profile.backlogs = Number(backlogs);
    if (tenthPercentage !== undefined) profile.tenthPercentage = Number(tenthPercentage);
    if (twelfthPercentage !== undefined) profile.twelfthPercentage = Number(twelfthPercentage);
    if (phone !== undefined) profile.phone = phone;
    if (resumeUrl !== undefined) profile.resumeUrl = resumeUrl;
    if (skills !== undefined) {
      profile.skills = Array.isArray(skills)
        ? skills
        : skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    await profile.save();

    // Optionally update user name
    if (req.body.name && req.body.name !== req.user.name) {
      await User.findByIdAndUpdate(req.user._id, { name: req.body.name });
    }

    const updatedProfile = await StudentProfile.findOne({ user: req.user._id })
      .populate('placedCompany', 'name industry website');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        ...updatedProfile.toObject(),
        name: req.body.name || req.user.name,
        email: req.user.email,
      },
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
      .populate('user', 'name email isActive createdAt')
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
    const activeDrives = await PlacementDrive.countDocuments({ status: { $in: ['Upcoming', 'Ongoing'] } });
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

