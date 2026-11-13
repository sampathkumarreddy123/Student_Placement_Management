import jwt from 'jsonwebtoken';
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

    // Create Associated Student Profile (no fake default scores or numbers)
    const profile = await StudentProfile.create({
      user: user._id,
      rollNumber: normalizedRoll,
      department: department.trim(),
      batch: targetGraduationYear,
      cgpa: req.body.cgpa !== undefined && req.body.cgpa !== null ? Number(req.body.cgpa) : 0,
      phone: req.body.phone ? req.body.phone.trim() : '',
      backlogs: req.body.backlogs !== undefined ? Number(req.body.backlogs) : 0,
    });

    // Generate JWT and set HTTP-only cookie
    const token = generateTokenAndSetCookie(res, user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Student account registered successfully!',
      token,
      user: {
        _id: user._id,
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

/**
 * Shared authentication logic for student, officer, and general logins
 */
const authenticateUser = async ({ email, password, requiredRole, rememberMe = false }, res) => {
  if (!email || !email.trim() || !password) {
    return {
      status: 400,
      body: {
        success: false,
        message: 'Please provide both your official email and password.',
      },
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    return {
      status: 401,
      body: {
        success: false,
        message: 'Invalid credentials. No account found with this email.',
      },
    };
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return {
      status: 401,
      body: {
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      },
    };
  }

  if (!user.isActive) {
    return {
      status: 403,
      body: {
        success: false,
        message: 'Your account has been deactivated. Please contact the placement cell.',
      },
    };
  }

  // Strict role verification if requiredRole is provided
  if (requiredRole && user.role !== requiredRole) {
    if (requiredRole === 'officer') {
      return {
        status: 403,
        body: {
          success: false,
          message:
            'Access denied: This login portal is restricted to Placement Officers only. Student accounts cannot sign in through the officer portal. Please use the Student Login page at /student/login.',
        },
      };
    } else if (requiredRole === 'student') {
      return {
        status: 403,
        body: {
          success: false,
          message:
            'Access denied: This portal is for students only. Placement Officers must sign in through the dedicated Officer Portal at /officer/login.',
        },
      };
    }
  }

  let profile = null;
  if (user.role === 'student') {
    profile = await StudentProfile.findOne({ user: user._id }).populate(
      'placedCompany',
      'name industry'
    );
  }

  // Set secure HTTP-only cookie
  const token = generateTokenAndSetCookie(res, user._id, user.role, rememberMe);

  return {
    status: 200,
    body: {
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: profile || null,
      },
    },
  };
};

// @desc    Authenticate user (General / Auto-detect role)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password, requiredRole, rememberMe } = req.body;
    const result = await authenticateUser({ email, password, requiredRole, rememberMe }, res);
    return res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
};

// @desc    Dedicated Placement Officer Login (Rejects student accounts)
// @route   POST /api/auth/officer/login
// @access  Public (Restricted to Placement Officers)
export const officerLogin = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    const result = await authenticateUser(
      { email, password, requiredRole: 'officer', rememberMe },
      res
    );
    return res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
};

// @desc    Dedicated Student Login (Rejects officer accounts)
// @route   POST /api/auth/student/login
// @access  Public (Restricted to Students)
export const studentLogin = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    const result = await authenticateUser(
      { email, password, requiredRole: 'student', rememberMe },
      res
    );
    return res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
};

// @desc    Secure Officer Account Creation (Protected server-side or invited by officer)
// @route   POST /api/auth/officer/create
// @access  Protected (Requires active Officer session OR valid server setup token)
export const createOfficerAccount = async (req, res, next) => {
  try {
    const setupToken = req.headers['x-setup-token'] || req.body?.setupToken;
    const validServerToken = process.env.OFFICER_SETUP_TOKEN || process.env.JWT_SECRET;
    const isTokenAuthorized = Boolean(setupToken && setupToken === validServerToken);
    let sessionUser = req.user;
    if (!sessionUser) {
      const rawToken =
        req.cookies?.token ||
        (req.headers.authorization?.startsWith('Bearer')
          ? req.headers.authorization.split(' ')[1]
          : null);
      if (rawToken) {
        try {
          const decoded = jwt.verify(
            rawToken,
            process.env.JWT_SECRET || 'placement_portal_fallback_secret_key_2026'
          );
          sessionUser = await User.findById(decoded.id);
        } catch (e) {
          // Token invalid or expired
        }
      }
    }
    const isOfficerSession = Boolean(sessionUser && sessionUser.role === 'officer');

    if (!isTokenAuthorized && !isOfficerSession) {
      return res.status(403).json({
        success: false,
        message:
          'Unauthorized: An active Placement Officer session or valid server setup token is required to provision officer accounts.',
      });
    }

    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the Placement Officer full name.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the official college email address.',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email format.',
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters in length for officer accounts.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `An account with email "${normalizedEmail}" already exists.`,
      });
    }

    const officer = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password, // Hashes via User pre-save hook
      role: 'officer',
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: `Placement Officer account for ${officer.name} (${officer.email}) provisioned successfully.`,
      officer: {
        _id: officer._id,
        id: officer._id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
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
