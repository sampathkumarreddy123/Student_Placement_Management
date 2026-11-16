import rateLimit from 'express-rate-limit';

const isTestEnv = () => process.env.NODE_ENV === 'test';

// General rate limiter for authentication routes (login / register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// Rate limiter for password reset requests (prevents email spamming)
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
  message: {
    success: false,
    message: 'Too many password reset requests. Please wait a few minutes before requesting another reset link.',
  },
});

// Rate limiter for resending verification emails
export const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
  message: {
    success: false,
    message: 'Too many verification email requests. Please wait a few minutes before requesting a new link.',
  },
});

// Rate limiter for security questions retrieval
export const securityQuestionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
  message: {
    success: false,
    message: 'Too many recovery requests from this IP. Please wait 15 minutes before trying again.',
  },
});

// Rate limiter for security questions verification
export const securityVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 verification requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
  message: {
    success: false,
    message: 'Too many verification attempts from this IP. Please wait 15 minutes before trying again.',
  },
});
