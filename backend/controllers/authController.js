import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import OfficerProfile from '../models/OfficerProfile.js';
import { generateTokenAndSetCookie, clearTokenCookie } from '../utils/generateToken.js';
import emailService, { sendEmail } from '../services/emailService.js';
import {
  PREDEFINED_SECURITY_QUESTIONS,
  isValidSecurityQuestion,
} from '../constants/securityQuestions.js';

/**
 * Dynamically resolves the frontend URL based on client request headers (Vercel, LAN, or local)
 */
export const getFrontendBaseUrl = (req) => {
  const origin = req.get('origin');
  if (origin && !origin.includes(':5000')) {
    return origin.replace(/\/+$/, '');
  }
  const referer = req.get('referer');
  if (referer) {
    try {
      const parsed = new URL(referer);
      if (!parsed.host.includes(':5000')) {
        return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, '');
      }
    } catch (_) {}
  }
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:5173'
  ).replace(/\/+$/, '');
};

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
      securityQuestions,
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

    // Validation: Security Questions (Mandatory exactly 3 predefined unique questions with non-empty answers)
    if (!Array.isArray(securityQuestions) || securityQuestions.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Please select and answer exactly 3 security questions for password recovery.',
      });
    }

    const selectedQuestionTexts = new Set();
    for (let i = 0; i < securityQuestions.length; i++) {
      const item = securityQuestions[i];
      if (!item || typeof item !== 'object') {
        return res.status(400).json({
          success: false,
          message: `Security question #${i + 1} is invalid.`,
        });
      }

      const qText = (item.question || '').trim();
      const aText = (item.answer || '').trim();

      if (!qText) {
        return res.status(400).json({
          success: false,
          message: `Please select security question #${i + 1}.`,
        });
      }

      if (!isValidSecurityQuestion(qText)) {
        return res.status(400).json({
          success: false,
          message: `Question #${i + 1} is not a valid predefined security question.`,
        });
      }

      if (selectedQuestionTexts.has(qText)) {
        return res.status(400).json({
          success: false,
          message: 'Each of the 3 security questions must be unique. Duplicate questions are not allowed.',
        });
      }
      selectedQuestionTexts.add(qText);

      if (!aText) {
        return res.status(400).json({
          success: false,
          message: `Please provide an answer for security question #${i + 1}.`,
        });
      }

      if (aText.length < 2) {
        return res.status(400).json({
          success: false,
          message: `Answer for security question #${i + 1} must be at least 2 characters long.`,
        });
      }
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
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password, // Pre-save hook hashes with bcryptjs
      role: 'student',
      isEmailVerified: false,
    });

    // Securely hash and store the 3 security questions
    await user.setSecurityQuestions(securityQuestions);

    // Generate time-limited email verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save();

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

    // Send verification email via centralized sender
    const frontendUrl = getFrontendBaseUrl(req);
    const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    try {
      await emailService.sendVerificationEmail({
        to: user.email,
        name: user.name,
        verifyUrl,
      });
    } catch (emailErr) {
      console.error('[Email] Failed to send registration verification email:', emailErr.message);
    }

    // Generate JWT and set HTTP-only cookie
    const token = generateTokenAndSetCookie(res, user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Student account registered successfully! A verification email has been sent to your email address.',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: false,
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
  } else if (user.role === 'officer') {
    profile = await OfficerProfile.findOne({ user: user._id });
  }

  const effectivePhoto = user.profilePhoto || profile?.profilePhoto || '';

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
        profilePhoto: effectivePhoto,
        isEmailVerified: Boolean(user.isEmailVerified),
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
      isEmailVerified: true, // Officer accounts are administratively verified
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
        isEmailVerified: true,
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
    } else if (user.role === 'officer') {
      profile = await OfficerProfile.findOne({ user: user._id });
      if (!profile) {
        profile = await OfficerProfile.create({ user: user._id });
      }
    }

    const effectivePhoto = user.profilePhoto || profile?.profilePhoto || '';

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: effectivePhoto,
        isEmailVerified: Boolean(user.isEmailVerified),
        createdAt: user.createdAt,
        profile: profile || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify student email using time-limited token
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const rawToken = (req.params.token || req.query.token || '').trim();
    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification link: missing token.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 1. Check if token matches an active, unexpired verification request
    let user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      // 2. Fallback: Check if user with this token is ALREADY verified (handles repeat clicks, SafeLinks scans, React Strict Mode)
      const alreadyVerifiedUser = await User.findOne({
        emailVerificationToken: hashedToken,
      });

      if (alreadyVerifiedUser && alreadyVerifiedUser.isEmailVerified) {
        return res.status(200).json({
          success: true,
          message: 'Your college email address is verified! You can apply for placement drives.',
          user: {
            id: alreadyVerifiedUser._id,
            email: alreadyVerifiedUser.email,
            isEmailVerified: true,
          },
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired email verification link. Please request a new verification link.',
      });
    }

    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Your email address has been successfully verified! You can now apply for placement drives.',
      user: {
        id: user._id,
        email: user.email,
        isEmailVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend email verification link
// @route   POST /api/auth/resend-verification
// @access  Public / Private
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const email = req.body?.email || req.user?.email;
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered college email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Protect against email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists and is unverified, a new verification link has been sent.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already verified.',
      });
    }

    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = getFrontendBaseUrl(req);
    const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    try {
      await emailService.sendVerificationEmail({
        to: user.email,
        name: user.name,
        verifyUrl,
      });
    } catch (emailErr) {
      console.error('[Email] Failed to resend verification email via SMTP:', emailErr.message);
      console.log('\n============================================================');
      console.log('🔗 [VERIFICATION FALLBACK LINK] (SMTP server unreachable):');
      console.log(verifyUrl);
      console.log('============================================================\n');

      return res.status(200).json({
        success: true,
        message: 'A fresh verification link has been sent to your email address.',
        devVerifyUrl: verifyUrl,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'A fresh verification link has been sent to your email address.',
      devVerifyUrl: process.env.NODE_ENV !== 'production' ? verifyUrl : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve security questions for student password recovery
// @route   POST /api/auth/security-questions or GET /api/auth/security-questions?identifier=...
// @access  Public (Subject to rate limiting)
export const getSecurityQuestions = async (req, res, next) => {
  try {
    const rawIdentifier = req.body?.identifier || req.query?.identifier;
    if (!rawIdentifier || !String(rawIdentifier).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered college email or roll number.',
      });
    }

    const cleanIdentifier = String(rawIdentifier).trim();
    let user = null;

    if (cleanIdentifier.includes('@')) {
      const emailRegex = new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      user = await User.findOne({
        email: emailRegex,
      }).select('+securityQuestions +securityQuestionLockUntil +securityQuestionAttempts');
    } else {
      const rollRegex = new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const studentProfile = await StudentProfile.findOne({
        rollNumber: rollRegex,
      });
      if (studentProfile) {
        user = await User.findById(studentProfile.user).select(
          '+securityQuestions +securityQuestionLockUntil +securityQuestionAttempts'
        );
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with the provided email or roll number.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact the placement cell.',
      });
    }

    if (user.isSecurityRecoveryLocked()) {
      const minutesLeft = Math.ceil(
        (user.securityQuestionLockUntil.getTime() - Date.now()) / (60 * 1000)
      );
      return res.status(423).json({
        success: false,
        locked: true,
        message: `Account recovery is temporarily locked due to repeated incorrect attempts. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
      });
    }

    if (!user.securityQuestions || user.securityQuestions.length !== 3) {
      return res.status(400).json({
        success: false,
        noSecurityQuestions: true,
        message:
          'Security questions were not configured for this account. For account safety, recovery via security questions is unavailable. Please contact the placement cell for password reset assistance.',
      });
    }

    // Return question titles only - NEVER hashes or plain answers
    const questions = user.securityQuestions.map((q) => q.question);

    return res.status(200).json({
      success: true,
      identifier: user.email,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify security question answers and generate short-lived reset token
// @route   POST /api/auth/verify-security-questions
// @access  Public (Subject to rate limiting and lockout)
export const verifySecurityQuestions = async (req, res, next) => {
  try {
    const { identifier, answers } = req.body;
    if (!identifier || !String(identifier).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered college email or roll number.',
      });
    }

    if (!Array.isArray(answers) || answers.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide answers for all 3 security questions.',
      });
    }

    for (let i = 0; i < answers.length; i++) {
      if (!answers[i] || !answers[i].question || !answers[i].answer || !String(answers[i].answer).trim()) {
        return res.status(400).json({
          success: false,
          message: `Please provide an answer for question #${i + 1}.`,
        });
      }
    }

    const cleanIdentifier = String(identifier).trim();
    let user = null;

    if (cleanIdentifier.includes('@')) {
      const emailRegex = new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      user = await User.findOne({
        email: emailRegex,
      }).select(
        '+securityQuestions +securityQuestions.answerHash +securityQuestionLockUntil +securityQuestionAttempts'
      );
    } else {
      const rollRegex = new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const studentProfile = await StudentProfile.findOne({
        rollNumber: rollRegex,
      });
      if (studentProfile) {
        user = await User.findById(studentProfile.user).select(
          '+securityQuestions +securityQuestions.answerHash +securityQuestionLockUntil +securityQuestionAttempts'
        );
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found or invalid recovery session.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact the placement cell.',
      });
    }

    // Verify all 3 answers against stored hashes with lockout and attempt tracking
    const verification = await user.verifySecurityAnswers(answers);
    if (!verification.success) {
      const statusCode = verification.locked ? 423 : 400;
      return res.status(statusCode).json({
        success: false,
        locked: verification.locked || false,
        message: verification.message,
      });
    }

    // Generate single-use, 15-minute cryptographically secure reset token
    const resetToken = user.getResetPasswordToken(15);
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Security questions verified successfully. Please enter your new password.',
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate password reset request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered college email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Protect against user enumeration by returning standard neutral message even if user not found
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been dispatched to it.',
      });
    }

    // Generate 60-minute cryptographically secure reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = getFrontendBaseUrl(req);
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        expiresInMinutes: 60,
      });
    } catch (emailErr) {
      console.error('[Email] Failed to send password reset email via SMTP:', emailErr.message);

      console.log('\n============================================================');
      console.log('🔗 [PASSWORD RESET FALLBACK LINK] (SMTP server unreachable):');
      console.log(resetUrl);
      console.log('============================================================\n');

      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been dispatched to it.',
        devResetUrl: resetUrl,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been dispatched to it.',
      devResetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using reset token
// @route   POST /api/auth/reset-password or /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const rawToken = (req.params.token || req.body.token || req.query?.token || '').trim();
    const { password, confirmPassword } = req.body;

    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password reset request: missing token.',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password.',
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
        message: 'New password and confirm password do not match.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link. Please request a new password reset.',
      });
    }

    // Officers must have at least 8 characters
    if (user.role === 'officer' && password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Placement Officer passwords must be at least 8 characters in length.',
      });
    }

    // Set new password (pre-save hook will hash via bcryptjs)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email to user's registered address
    emailService
      .sendPasswordResetConfirmationEmail({
        to: user.email,
        name: user.name,
        resetTime: new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      })
      .catch((err) => {
        console.error('[Email] Failed to send password reset confirmation email:', err.message);
      });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new credentials.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user's security questions (questions only, never answer hashes)
// @route   GET /api/auth/my-security-questions
// @access  Private
export const getMySecurityQuestions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+securityQuestions');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User session not found.',
      });
    }

    const hasQuestions = Boolean(user.securityQuestions && user.securityQuestions.length === 3);
    const questions = hasQuestions ? user.securityQuestions.map((q) => q.question) : [];

    return res.status(200).json({
      success: true,
      hasSecurityQuestions: hasQuestions,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password for authenticated user (Student or Officer)
// @route   PUT /api/auth/change-password
// @access  Private (Both roles)
export const changePassword = async (req, res, next) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
      securityAnswers,
      securityQuestions,
    } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    if (req.user.role === 'officer' && newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Placement Officer password must be at least 8 characters long.',
      });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match.',
      });
    }

    // Retrieve user with password hash & security questions
    const user = await User.findById(req.user.id).select(
      '+password +securityQuestions +securityQuestions.answerHash +securityQuestionLockUntil +securityQuestionAttempts'
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    let isAuthorized = false;

    // Authorization Method A: Verification via 3 Security Question Answers
    if (
      user.securityQuestions &&
      user.securityQuestions.length === 3 &&
      securityAnswers &&
      Array.isArray(securityAnswers) &&
      securityAnswers.length === 3
    ) {
      const verification = await user.verifySecurityAnswers(securityAnswers);
      if (!verification.success) {
        return res.status(verification.locked ? 423 : 400).json({
          success: false,
          locked: verification.locked || false,
          message: verification.message,
        });
      }
      isAuthorized = true;
    }

    // Authorization Method B: Current Password
    if (!isAuthorized && currentPassword) {
      const isMatch = await user.matchPassword(currentPassword);
      if (isMatch) {
        isAuthorized = true;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Incorrect current password. Please try again or answer your security questions.',
        });
      }
    }

    // Authorization Method C: Setting up 3 security questions for the first time
    if (
      !isAuthorized &&
      (!user.securityQuestions || user.securityQuestions.length !== 3) &&
      securityQuestions &&
      Array.isArray(securityQuestions) &&
      securityQuestions.length === 3
    ) {
      const chosen = new Set();
      for (let i = 0; i < securityQuestions.length; i++) {
        const sq = securityQuestions[i];
        if (!sq.question || !isValidSecurityQuestion(sq.question)) {
          return res.status(400).json({
            success: false,
            message: `Security question #${i + 1} is invalid.`,
          });
        }
        if (chosen.has(sq.question)) {
          return res.status(400).json({
            success: false,
            message: 'All 3 security questions must be unique.',
          });
        }
        chosen.add(sq.question);

        if (!sq.answer || String(sq.answer).trim().length < 2) {
          return res.status(400).json({
            success: false,
            message: `Answer for security question #${i + 1} must be at least 2 characters.`,
          });
        }
      }
      await user.setSecurityQuestions(securityQuestions);
      isAuthorized = true;
    }

    if (!isAuthorized) {
      if (user.securityQuestions && user.securityQuestions.length === 3) {
        return res.status(400).json({
          success: false,
          message: 'Please answer your 3 security questions to authorize this password change.',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Please answer your security questions or provide your current password.',
        });
      }
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Your password has been changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
