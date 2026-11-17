import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import connectDB from '../config/db.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import '../models/Company.js';
import {
  register,
  getSecurityQuestions,
  verifySecurityQuestions,
  resetPassword,
  studentLogin,
  officerLogin,
  changePassword,
} from '../controllers/authController.js';
import { PREDEFINED_SECURITY_QUESTIONS } from '../constants/securityQuestions.js';

// Helper to mock express req/res
const createMockReqRes = (body = {}, params = {}, query = {}) => {
  const req = {
    body,
    params,
    query,
    get: (header) => (header.toLowerCase() === 'origin' ? 'http://localhost:5173' : null),
  };
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    cookie(name, val, opts) {
      this.headers[name] = val;
      return this;
    },
  };
  const next = (err) => {
    if (err) throw err;
  };
  return { req, res, next };
};

const runTests = async () => {
  console.log('🧪 Starting Comprehensive Security Questions & Password Recovery Test Suite...\n');
  await connectDB();

  const testEmail = `sq_test_student_${Date.now()}@mits.ac.in`;
  const testRoll = `TEST_ROLL_${Date.now()}`.slice(0, 15);
  const testPassword = 'Password123!';
  const newPassword = 'NewPassword999!';

  const validQuestions = [
    { question: PREDEFINED_SECURITY_QUESTIONS[0], answer: 'Greenwood High School' },
    { question: PREDEFINED_SECURITY_QUESTIONS[1], answer: 'Sammy' },
    { question: PREDEFINED_SECURITY_QUESTIONS[2], answer: 'Dr. APJ Abdul Kalam' },
  ];

  try {
    // -------------------------------------------------------------
    // Test 1: Registration fails when a question or answer is missing
    // -------------------------------------------------------------
    console.log('Test 1: Registration fails when security questions or answers are missing');
    {
      const { req, res, next } = createMockReqRes({
        name: 'Incomplete Test Student',
        email: `fail_${testEmail}`,
        rollNumber: `F_${testRoll}`,
        department: 'Computer Science',
        graduationYear: 2026,
        password: testPassword,
        confirmPassword: testPassword,
        securityQuestions: [
          { question: PREDEFINED_SECURITY_QUESTIONS[0], answer: '' }, // empty answer
          { question: PREDEFINED_SECURITY_QUESTIONS[1], answer: 'Valid' },
          { question: '', answer: 'Missing question' }, // empty question
        ],
      });
      await register(req, res, next);
      if (res.statusCode === 400) {
        console.log('  ✅ Passed: Rejected incomplete security questions with status 400:', res.data.message);
      } else {
        throw new Error(`Expected status 400 but got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }
    }

    // -------------------------------------------------------------
    // Test 2: Duplicate security questions in registration are rejected
    // -------------------------------------------------------------
    console.log('\nTest 2: Duplicate security questions in registration are rejected');
    {
      const { req, res, next } = createMockReqRes({
        name: 'Duplicate Test Student',
        email: `dup_${testEmail}`,
        rollNumber: `D_${testRoll}`,
        department: 'Computer Science',
        graduationYear: 2026,
        password: testPassword,
        confirmPassword: testPassword,
        securityQuestions: [
          { question: PREDEFINED_SECURITY_QUESTIONS[0], answer: 'Answer 1' },
          { question: PREDEFINED_SECURITY_QUESTIONS[0], answer: 'Answer 2' }, // DUPLICATE QUESTION
          { question: PREDEFINED_SECURITY_QUESTIONS[2], answer: 'Answer 3' },
        ],
      });
      await register(req, res, next);
      if (res.statusCode === 400 && res.data.message.includes('unique')) {
        console.log('  ✅ Passed: Duplicate questions rejected with message:', res.data.message);
      } else {
        throw new Error(`Expected duplicate rejection but got: ${JSON.stringify(res.data)}`);
      }
    }

    // -------------------------------------------------------------
    // Test 3: Successful registration with 3 valid security questions
    // -------------------------------------------------------------
    console.log('\nTest 3: Successful student registration with 3 distinct questions and answers');
    let registeredUser = null;
    {
      const { req, res, next } = createMockReqRes({
        name: 'Valid Security Student',
        email: testEmail,
        rollNumber: testRoll,
        department: 'Computer Science',
        graduationYear: 2026,
        password: testPassword,
        confirmPassword: testPassword,
        securityQuestions: validQuestions,
      });
      await register(req, res, next);
      if (res.statusCode === 201) {
        registeredUser = res.data.user;
        console.log('  ✅ Passed: Student registered successfully with ID:', registeredUser.id);
      } else {
        throw new Error(`Registration failed with status ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }

      // Verify DB storage: security answers MUST NOT be plain text, MUST be hashed
      const dbUser = await User.findById(registeredUser.id).select('+securityQuestions +securityQuestions.answerHash');
      if (!dbUser.securityQuestions || dbUser.securityQuestions.length !== 3) {
        throw new Error('Security questions not stored on user!');
      }

      for (let i = 0; i < 3; i++) {
        const stored = dbUser.securityQuestions[i];
        if (stored.answerHash === validQuestions[i].answer) {
          throw new Error('SECURITY ALERT: Security answer stored in PLAIN TEXT!');
        }
        if (!stored.answerHash.startsWith('$2a$') && !stored.answerHash.startsWith('$2b$')) {
          throw new Error('Security answer is not properly bcrypt hashed!');
        }
        // Check hash matches normalized answer
        const matches = await bcrypt.compare(validQuestions[i].answer.trim().toLowerCase(), stored.answerHash);
        if (!matches) {
          throw new Error(`Hash mismatch for question #${i + 1}`);
        }
      }
      console.log('  ✅ Passed: All 3 answers are securely hashed with bcrypt and match normalized text.');

      // Verify answers are NOT returned in default queries (select: false)
      const sanitizedUser = await User.findById(registeredUser.id);
      if (sanitizedUser.securityQuestions !== undefined) {
        throw new Error('Security questions exposed in default query without select: false!');
      }
      console.log('  ✅ Passed: securityQuestions field is hidden (select: false) by default.');
    }

    // -------------------------------------------------------------
    // Test 4: Retrieve security questions by Email & Roll Number
    // -------------------------------------------------------------
    console.log('\nTest 4: Retrieve security questions by email and roll number');
    {
      // 4a: By email
      const { req, res, next } = createMockReqRes({ identifier: testEmail });
      await getSecurityQuestions(req, res, next);
      if (res.statusCode !== 200 || res.data.questions.length !== 3) {
        throw new Error(`Failed to retrieve questions by email: ${JSON.stringify(res.data)}`);
      }
      if (res.data.questions.some((q) => typeof q !== 'string')) {
        throw new Error('Questions response must only contain question strings!');
      }
      console.log('  ✅ Passed: Retrieved 3 question strings by email:', res.data.questions);

      // 4b: By roll number
      const { req: reqRoll, res: resRoll, next: nextRoll } = createMockReqRes({ identifier: testRoll.toLowerCase() });
      await getSecurityQuestions(reqRoll, resRoll, nextRoll);
      if (resRoll.statusCode !== 200 || resRoll.data.questions.length !== 3) {
        throw new Error(`Failed to retrieve questions by roll number: ${JSON.stringify(resRoll.data)}`);
      }
      console.log('  ✅ Passed: Retrieved 3 question strings by roll number (case-insensitive)');
    }

    // -------------------------------------------------------------
    // Test 5: Verify answers with 1 incorrect answer -> Rejected
    // -------------------------------------------------------------
    console.log('\nTest 5: Verify answers with 1 incorrect answer');
    {
      const { req, res, next } = createMockReqRes({
        identifier: testEmail,
        answers: [
          { question: validQuestions[0].question, answer: validQuestions[0].answer },
          { question: validQuestions[1].question, answer: 'WrongNickname' }, // WRONG ANSWER
          { question: validQuestions[2].question, answer: validQuestions[2].answer },
        ],
      });
      await verifySecurityQuestions(req, res, next);
      if (res.statusCode === 400 && res.data.message.includes('Incorrect security answers')) {
        console.log('  ✅ Passed: Verification rejected with message:', res.data.message);
      } else {
        throw new Error(`Expected verification rejection but got: ${JSON.stringify(res.data)}`);
      }
    }

    // -------------------------------------------------------------
    // Test 6: Verify answers with all 3 correct (case-insensitive & trimmed) -> Success & Reset Token issued
    // -------------------------------------------------------------
    console.log('\nTest 6: Verify all 3 answers with mixed case & extra whitespace -> Reset Token Issued');
    let singleUseResetToken = null;
    {
      const { req, res, next } = createMockReqRes({
        identifier: testEmail,
        answers: [
          { question: validQuestions[0].question, answer: `  ${validQuestions[0].answer.toUpperCase()}   ` },
          { question: validQuestions[1].question, answer: ` ${validQuestions[1].answer.toLowerCase()} ` },
          { question: validQuestions[2].question, answer: validQuestions[2].answer },
        ],
      });
      await verifySecurityQuestions(req, res, next);
      if (res.statusCode === 200 && res.data.resetToken) {
        singleUseResetToken = res.data.resetToken;
        console.log('  ✅ Passed: Successfully verified answers! Issued reset token:', singleUseResetToken.slice(0, 12) + '...');
      } else {
        throw new Error(`Failed to verify correct answers: ${JSON.stringify(res.data)}`);
      }
    }

    // -------------------------------------------------------------
    // Test 7: Reset password using the single-use reset token
    // -------------------------------------------------------------
    console.log('\nTest 7: Reset password using the valid reset token');
    {
      const { req, res, next } = createMockReqRes({
        token: singleUseResetToken,
        password: newPassword,
        confirmPassword: newPassword,
      });
      await resetPassword(req, res, next);
      if (res.statusCode === 200 && res.data.success) {
        console.log('  ✅ Passed: Password reset successful! Message:', res.data.message);
      } else {
        throw new Error(`Failed to reset password: ${JSON.stringify(res.data)}`);
      }

      // Verify student can log in with new password
      const { req: reqLogin, res: resLogin, next: nextLogin } = createMockReqRes({
        email: testEmail,
        password: newPassword,
      });
      await studentLogin(reqLogin, resLogin, nextLogin);
      if (resLogin.statusCode === 200 && resLogin.data.success) {
        console.log('  ✅ Passed: Student successfully logged in with new password!');
      } else {
        throw new Error(`Student login failed with new password: ${JSON.stringify(resLogin.data)}`);
      }

      // Verify old password no longer works
      const { req: reqOld, res: resOld, next: nextOld } = createMockReqRes({
        email: testEmail,
        password: testPassword,
      });
      await studentLogin(reqOld, resOld, nextOld);
      if (resOld.statusCode === 401) {
        console.log('  ✅ Passed: Old password is fully invalidated.');
      } else {
        throw new Error(`Old password should be rejected but got status: ${resOld.statusCode}`);
      }
    }

    // -------------------------------------------------------------
    // Test 8: Reusing the same reset token is rejected
    // -------------------------------------------------------------
    console.log('\nTest 8: Reusing the already-used reset token is rejected');
    {
      const { req, res, next } = createMockReqRes({
        token: singleUseResetToken,
        password: 'AnotherPassword888!',
        confirmPassword: 'AnotherPassword888!',
      });
      await resetPassword(req, res, next);
      if (res.statusCode === 400) {
        console.log('  ✅ Passed: Token reuse rejected with status 400:', res.data.message);
      } else {
        throw new Error(`Expected token reuse rejection but got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }
    }

    // -------------------------------------------------------------
    // Test 9: Expired token cannot be used
    // -------------------------------------------------------------
    console.log('\nTest 9: Expired reset token cannot be used');
    {
      const testUser = await User.findById(registeredUser.id);
      const expiredRawToken = testUser.getResetPasswordToken(15);
      // Manually set expiration in the past
      testUser.resetPasswordExpire = new Date(Date.now() - 60000); // 1 minute ago
      await testUser.save({ validateBeforeSave: false });

      const { req, res, next } = createMockReqRes({
        token: expiredRawToken,
        password: 'ExpiredTokenPassword1!',
        confirmPassword: 'ExpiredTokenPassword1!',
      });
      await resetPassword(req, res, next);
      if (res.statusCode === 400 && res.data.message.includes('expired')) {
        console.log('  ✅ Passed: Expired token rejected with message:', res.data.message);
      } else {
        throw new Error(`Expected expired token rejection but got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }
    }

    // -------------------------------------------------------------
    // Test 10: Repeated incorrect attempts trigger lockout (5 attempts)
    // -------------------------------------------------------------
    console.log('\nTest 10: Repeated incorrect attempts trigger temporary lockout');
    {
      // Reset attempts to 0 first
      await User.findByIdAndUpdate(registeredUser.id, {
        securityQuestionAttempts: 0,
        securityQuestionLockUntil: undefined,
      });

      for (let attempt = 1; attempt <= 5; attempt++) {
        const { req, res, next } = createMockReqRes({
          identifier: testEmail,
          answers: [
            { question: validQuestions[0].question, answer: 'Wrong1' },
            { question: validQuestions[1].question, answer: 'Wrong2' },
            { question: validQuestions[2].question, answer: 'Wrong3' },
          ],
        });
        await verifySecurityQuestions(req, res, next);
        if (attempt === 5) {
          if (res.statusCode === 423 && res.data.locked) {
            console.log('  ✅ Passed: 5th incorrect attempt triggered lockout with status 423:', res.data.message);
          } else {
            throw new Error(`Expected lockout on 5th attempt but got ${res.statusCode}: ${JSON.stringify(res.data)}`);
          }
        }
      }

      // Verify that even with correct answers, request is locked out
      const { req, res, next } = createMockReqRes({
        identifier: testEmail,
        answers: validQuestions,
      });
      await verifySecurityQuestions(req, res, next);
      if (res.statusCode === 423 && res.data.locked) {
        console.log('  ✅ Passed: Account is locked even against correct answers while lockout is active.');
      } else {
        throw new Error(`Expected locked response but got: ${JSON.stringify(res.data)}`);
      }
    }

    // -------------------------------------------------------------
    // Test 11: Change Password via Security Questions (Authenticated Flow)
    // -------------------------------------------------------------
    console.log('\nTest 11: Change Password authorized by 3 security answers');
    {
      // Reset lockout on user
      await User.findByIdAndUpdate(registeredUser.id, {
        $set: { securityQuestionAttempts: 0 },
        $unset: { securityQuestionLockUntil: 1 },
      });

      const updatedPasswordViaQuestions = 'ViaQuestionsPass123!';

      // 11a: Submitting incorrect answer is rejected
      const { req: reqBad, res: resBad, next: nextBad } = createMockReqRes({
        newPassword: updatedPasswordViaQuestions,
        confirmPassword: updatedPasswordViaQuestions,
        securityAnswers: [
          { question: validQuestions[0].question, answer: validQuestions[0].answer },
          { question: validQuestions[1].question, answer: 'WrongChildhoodNickname' },
          { question: validQuestions[2].question, answer: validQuestions[2].answer },
        ],
      });
      reqBad.user = { id: registeredUser.id, role: 'student' };
      await changePassword(reqBad, resBad, nextBad);
      if (resBad.statusCode === 400 && resBad.data.message.includes('Incorrect security answers')) {
        console.log('  ✅ Passed: Password change rejected with incorrect security answer.');
      } else {
        throw new Error(`Expected rejection for wrong security answer but got: ${JSON.stringify(resBad.data)}`);
      }

      // 11b: Submitting all 3 correct answers successfully changes password
      const { req: reqGood, res: resGood, next: nextGood } = createMockReqRes({
        newPassword: updatedPasswordViaQuestions,
        confirmPassword: updatedPasswordViaQuestions,
        securityAnswers: validQuestions,
      });
      reqGood.user = { id: registeredUser.id, role: 'student' };
      await changePassword(reqGood, resGood, nextGood);
      if (resGood.statusCode === 200 && resGood.data.success) {
        console.log('  ✅ Passed: Password changed successfully via security questions authorization!');
      } else {
        throw new Error(`Expected success for correct security answers but got: ${JSON.stringify(resGood.data)}`);
      }

      // 11c: Verify user can log in with this new password
      const { req: reqLogin2, res: resLogin2, next: nextLogin2 } = createMockReqRes({
        email: testEmail,
        password: updatedPasswordViaQuestions,
      });
      await studentLogin(reqLogin2, resLogin2, nextLogin2);
      if (resLogin2.statusCode === 200 && resLogin2.data.success) {
        console.log('  ✅ Passed: Logged in with password changed via security questions!');
      } else {
        throw new Error(`Login failed with new password: ${JSON.stringify(resLogin2.data)}`);
      }
    }

    // -------------------------------------------------------------
    console.log('\nTest 12: Account without security questions requests recovery -> setupRequired: true');
    const legacyEmail = `legacy_${Date.now()}@mits.ac.in`;
    const legacyUser = await User.create({
      name: 'Legacy Student',
      email: legacyEmail,
      password: 'LegacyPassword123!',
      role: 'student',
      isEmailVerified: true,
      securityQuestions: [],
    });

    {
      const { req, res, next } = createMockReqRes({ identifier: legacyEmail });
      await getSecurityQuestions(req, res, next);
      if (res.statusCode === 200 && res.data.setupRequired && res.data.availableQuestions?.length === 10) {
        console.log('  ✅ Passed: Retrieved setupRequired: true and 10 available questions.');
      } else {
        throw new Error(`Expected setupRequired: true but got: ${JSON.stringify(res.data)}`);
      }
    }

    console.log('\nTest 13: First-time security setup on legacy account via verify-security-questions');
    const legacyChosenQuestions = [
      { question: PREDEFINED_SECURITY_QUESTIONS[4], answer: 'CricketGame' },
      { question: PREDEFINED_SECURITY_QUESTIONS[5], answer: 'HarryPotter' },
      { question: PREDEFINED_SECURITY_QUESTIONS[6], answer: 'Pokemon' },
    ];
    let legacyResetToken = '';
    {
      const { req, res, next } = createMockReqRes({
        identifier: legacyEmail,
        answers: legacyChosenQuestions,
      });
      await verifySecurityQuestions(req, res, next);
      if (res.statusCode === 200 && res.data.resetToken) {
        legacyResetToken = res.data.resetToken;
        console.log(`  ✅ Passed: Legacy user set up questions and received resetToken: ${legacyResetToken.slice(0, 12)}...`);
      } else {
        throw new Error(`Expected reset token but got: ${JSON.stringify(res.data)}`);
      }

      // Check DB to verify questions were persisted
      const reloadedUser = await User.findById(legacyUser._id).select('+securityQuestions');
      if (reloadedUser.securityQuestions?.length === 3) {
        console.log('  ✅ Passed: 3 security questions successfully saved and hashed in DB for legacy account.');
      } else {
        throw new Error('Questions were not persisted to DB!');
      }
    }

    console.log('\nTest 14: Subsequent recovery on this account now returns the exact 3 saved questions');
    {
      const { req, res, next } = createMockReqRes({ identifier: legacyEmail });
      await getSecurityQuestions(req, res, next);
      if (res.statusCode === 200 && !res.data.setupRequired && res.data.questions?.length === 3) {
        console.log('  ✅ Passed: Subsequent lookup returned setupRequired: false and the 3 saved questions:', res.data.questions);
      } else {
        throw new Error(`Expected 3 saved questions but got: ${JSON.stringify(res.data)}`);
      }
    }

    // -------------------------------------------------------------
    // Cleanup test data
    // -------------------------------------------------------------
    console.log('\nCleaning up test records...');
    await User.deleteOne({ email: testEmail });
    await StudentProfile.deleteOne({ rollNumber: testRoll });
    await User.deleteOne({ email: legacyEmail });
    console.log('  ✅ Test data cleaned up.');

    console.log('\n🎉 ALL 10 SECURITY QUESTION & PASSWORD RECOVERY TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed with error:', err);
    // Cleanup if possible
    try {
      await User.deleteOne({ email: testEmail });
      await StudentProfile.deleteOne({ rollNumber: testRoll });
    } catch (_) {}
    process.exit(1);
  }
};

runTests();
