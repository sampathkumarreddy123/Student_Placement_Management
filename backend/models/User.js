import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['student', 'officer'],
      default: 'student',
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpire: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    securityQuestions: {
      type: [
        {
          question: {
            type: String,
            required: true,
            trim: true,
          },
          answerHash: {
            type: String,
            required: true,
            select: false,
          },
        },
      ],
      select: false,
    },
    securityQuestionAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    securityQuestionLockUntil: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash email verification token
userSchema.methods.getEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return verificationToken;
};

// Generate and hash password reset token (configurable expiration, defaults to 15 minutes)
userSchema.methods.getResetPasswordToken = function (expireMinutes = 15) {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = new Date(Date.now() + expireMinutes * 60 * 1000);
  return resetToken;
};

// Check if security recovery is locked out due to failed attempts
userSchema.methods.isSecurityRecoveryLocked = function () {
  return Boolean(
    this.securityQuestionLockUntil && this.securityQuestionLockUntil > Date.now()
  );
};

// Hash and store security questions and answers
userSchema.methods.setSecurityQuestions = async function (questionsWithAnswers) {
  const hashed = [];
  for (const item of questionsWithAnswers) {
    const normalizedAnswer = String(item.answer || '').trim().toLowerCase();
    const salt = await bcrypt.genSalt(10);
    const answerHash = await bcrypt.hash(normalizedAnswer, salt);
    hashed.push({
      question: item.question.trim(),
      answerHash,
    });
  }
  this.securityQuestions = hashed;
  this.markModified('securityQuestions');
  this.securityQuestionAttempts = 0;
  this.securityQuestionLockUntil = undefined;
};

// Verify submitted security question answers against stored hashes
userSchema.methods.verifySecurityAnswers = async function (submittedAnswers) {
  if (this.isSecurityRecoveryLocked()) {
    const minutesLeft = Math.ceil(
      (this.securityQuestionLockUntil.getTime() - Date.now()) / (60 * 1000)
    );
    return {
      success: false,
      locked: true,
      message: `Account recovery is temporarily locked due to repeated incorrect attempts. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
    };
  }

  if (!this.securityQuestions || this.securityQuestions.length !== 3) {
    return {
      success: false,
      message:
        'Security questions are not configured for this account. Please contact the placement cell for recovery assistance.',
    };
  }

  // Verify all 3 questions and answers
  let allMatched = true;
  for (const stored of this.securityQuestions) {
    const matchSubmission = submittedAnswers.find(
      (s) => s.question && s.question.trim() === stored.question.trim()
    );

    if (!matchSubmission || !matchSubmission.answer || !matchSubmission.answer.trim()) {
      allMatched = false;
      break;
    }

    const normalizedSubmitted = String(matchSubmission.answer).trim().toLowerCase();
    const isCorrect = await bcrypt.compare(normalizedSubmitted, stored.answerHash);
    if (!isCorrect) {
      allMatched = false;
      break;
    }
  }

  if (!allMatched) {
    this.securityQuestionAttempts = (this.securityQuestionAttempts || 0) + 1;
    if (this.securityQuestionAttempts >= 5) {
      this.securityQuestionLockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
      await this.save({ validateBeforeSave: false });
      return {
        success: false,
        locked: true,
        message:
          'Maximum verification attempts exceeded. Account recovery has been locked for 15 minutes for your protection.',
      };
    }
    await this.save({ validateBeforeSave: false });
    const remaining = 5 - this.securityQuestionAttempts;
    return {
      success: false,
      message: `Incorrect security answers. You have ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before temporary lockout.`,
    };
  }

  // Reset attempt count upon successful verification
  this.securityQuestionAttempts = 0;
  this.securityQuestionLockUntil = undefined;
  await this.save({ validateBeforeSave: false });

  return { success: true };
};

const User = mongoose.model('User', userSchema);
export default User;

