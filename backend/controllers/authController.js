import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { generateTokenAndSetCookie, clearTokenCookie } from '../utils/generateToken.js';

// @desc    Register a new student account
// @route   POST /api/auth/register
// @access  Public (Students only - Officer accounts cannot be registered publicly)
export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      rollNumber,
      department,
      graduationYear,
      batch,
    } = req.body;

    // Reject any attempt to register as an officer publicly
    if (req.body.role && req.body.role.toLowerCase() === 'officer') {
      return res.status(403).json({
        success: false,
        message: 'Public registration is restricted to students. Placement Officer accounts must be provisioned by the system administrator.',
      });
    }

    // Validation: All required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your full name.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your college email address.',
      });
    }

    // Email format validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email format (e.g., student@college.edu).',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.',
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match.',
      });
    }

    if (!rollNumber || !rollNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your university roll number / registration ID.',
      });
    }

    if (!department || !department.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please select your academic department.',
      });
    }

    const targetGraduationYear = Number(graduationYear || batch);
    if (!targetGraduationYear || isNaN(targetGraduationYear)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid graduation year (e.g., 2026).',
      });
    }

    // Uniqueness Check 1: College Email
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this college email address already exists. Please log in.',
      });
    }

    // Uniqueness Check 2: Roll Number
    const normalizedRoll = rollNumber.trim().toUpperCase();
    const existingRoll = await StudentProfile.findOne({ rollNumber: normalizedRoll });
    if (existingRoll) {
      return res.status(400).json({
        success: false,
        message: `A student profile with roll number "${normalizedRoll}" is already registered.`,
      });
    }

    // Create User (strictly student role)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password, // Pre-save hook hashes with bcryptjs
      role: 'student',
    });

    // Create Associated Student Profile
    const profile = await StudentProfile.create({
      user: user._id,
      rollNumber: normalizedRoll,
      department: department.trim(),
      batch: targetGraduationYear,
      cgpa: req.body.cgpa !== undefined ? Number(req.body.cgpa) : 7.0,
      backlogs: req.body.backlogs !== undefined ? Number(req.body.backlogs) : 0,
    });

    // Generate JWT and set HTTP-only cookie
    const token = generateTokenAndSetCookie(res, user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Student account registered successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user (Student or Officer) & set JWT cookie
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your college email and password.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with this email.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the placement administrator.',
      });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id }).populate(
        'placedCompany',
        'name industry'
      );
    }

    // Set secure HTTP-only cookie
    const token = generateTokenAndSetCookie(res, user._id, user.role);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: profile || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log out current user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Get current authenticated session profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User session not found.',
      });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id }).populate(
        'placedCompany',
        'name industry'
      );
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        profile: profile || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
