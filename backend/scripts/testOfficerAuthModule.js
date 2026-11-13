import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import connectDB from '../config/db.js';
import User from '../models/User.js';
import authRoutes from '../routes/authRoutes.js';
import userRoutes from '../routes/userRoutes.js';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: [],
};

const record = (name, passed, notes = '') => {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    results.failed++;
    console.log(`  ❌ [FAIL] ${name} - ${notes}`);
  }
  results.details.push({ name, passed, notes });
};

const run = async () => {
  console.log('===========================================================');
  console.log(' OFFICER AUTHENTICATION MODULE - VERIFICATION TEST SUITE');
  console.log('===========================================================\n');

  await connectDB();

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);

  const TEST_PORT = 5057;
  const server = app.listen(TEST_PORT);
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  class TestClient {
    constructor() {
      this.cookies = {};
    }

    async request(urlPath, options = {}) {
      const headers = options.headers || {};
      const cookieHeader = Object.entries(this.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      if (cookieHeader) headers['Cookie'] = cookieHeader;

      const res = await fetch(`${BASE_URL}${urlPath}`, {
        ...options,
        headers,
      });

      const rawSetCookie = res.headers.get('set-cookie');
      if (rawSetCookie) {
        const parts = rawSetCookie.split(';');
        const [cookiePair] = parts;
        if (cookiePair && cookiePair.includes('=')) {
          const [k, v] = cookiePair.trim().split('=');
          this.cookies[k] = v;
        }
      }

      let data;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      return { status: res.status, data, headers: res.headers };
    }
  }

  const officerClient = new TestClient();
  const studentClient = new TestClient();
  const unauthClient = new TestClient();

  const timestamp = Date.now();
  const testStudentEmail = `auth_test_student_${timestamp}@college.edu`;
  const createdOfficerEmail = `assistant_officer_${timestamp}@college.edu`;

  try {
    // 0. Setup a test student
    const studentReg = await studentClient.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student For Auth',
        email: testStudentEmail,
        password: 'StudentPass123!',
        confirmPassword: 'StudentPass123!',
        rollNumber: `ROLL_${timestamp}`,
        department: 'Computer Science',
        graduationYear: 2026,
      }),
    });
    record('Test Setup: Student account registration', studentReg.status === 201);

    // 1. Test Valid Officer Login
    const validOfficerRes = await officerClient.request('/api/auth/officer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'officer@college.edu',
        password: 'Officer@123',
        rememberMe: true,
      }),
    });
    const validOfficerPassed =
      validOfficerRes.status === 200 &&
      validOfficerRes.data.success &&
      validOfficerRes.data.user?.role === 'officer' &&
      Boolean(officerClient.cookies.token);
    record(
      'Valid Officer Login: Authenticates and returns officer session',
      validOfficerPassed,
      validOfficerRes.data.message
    );

    // 2. Test Password not exposed in officer response
    record(
      'Security: Officer password and hash strictly excluded from response',
      validOfficerRes.data.user?.password === undefined,
      'password field must be undefined'
    );

    // 3. Test Remember Me session duration (30 days max-age ~ 2592000s)
    const setCookieHeader = validOfficerRes.headers.get('set-cookie') || '';
    const has30DaysMaxAge = setCookieHeader.includes('Max-Age=2592000');
    record(
      'Remember Session: Generates 30-day extended cookie on rememberMe=true',
      has30DaysMaxAge,
      setCookieHeader
    );

    // 4. Test Invalid Password on Officer Login
    const badPassClient = new TestClient();
    const badPassRes = await badPassClient.request('/api/auth/officer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'officer@college.edu',
        password: 'WrongPassword123!',
      }),
    });
    const badPassPassed =
      badPassRes.status === 401 &&
      badPassRes.data.message?.includes('Incorrect password') &&
      !badPassClient.cookies.token;
    record(
      'Invalid Password: HTTP 401 rejection with no session cookie set',
      badPassPassed,
      badPassRes.data.message
    );

    // 5. Test Student Attempting Officer Login (Strict Role Rejection)
    const studentTriesOfficerLogin = await unauthClient.request('/api/auth/officer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudentEmail,
        password: 'StudentPass123!',
      }),
    });
    const studentBlockedPassed =
      studentTriesOfficerLogin.status === 403 &&
      studentTriesOfficerLogin.data.message?.includes('Access denied') &&
      !unauthClient.cookies.token;
    record(
      'Role Enforcement: Student account attempting officer login is rejected (HTTP 403)',
      studentBlockedPassed,
      studentTriesOfficerLogin.data.message
    );

    // 6. Test Officer Attempting Student Login (Strict Role Rejection)
    const officerTriesStudentLogin = await unauthClient.request('/api/auth/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'officer@college.edu',
        password: 'Officer@123',
      }),
    });
    const officerBlockedPassed =
      officerTriesStudentLogin.status === 403 &&
      officerTriesStudentLogin.data.message?.includes('Access denied');
    record(
      'Role Enforcement: Officer account attempting student login is rejected (HTTP 403)',
      officerBlockedPassed,
      officerTriesStudentLogin.data.message
    );

    // 7. Test Unauthenticated Access to Officer Dashboard
    const unauthDashRes = await unauthClient.request('/api/users/officer/dashboard');
    record(
      'Unauthenticated Access: Protected officer routes reject with HTTP 401',
      unauthDashRes.status === 401,
      `Status: ${unauthDashRes.status}`
    );

    // 8. Test Authenticated Officer Access to Dashboard
    const officerDashRes = await officerClient.request('/api/users/officer/dashboard');
    record(
      'Authorized Officer Access: Permitted access to Officer Dashboard (HTTP 200)',
      officerDashRes.status === 200 && officerDashRes.data.stats !== undefined,
      `Stats: ${JSON.stringify(officerDashRes.data.stats ? 'Available' : 'Missing')}`
    );

    // 9. Test Invalid/Expired Session Token
    const expiredClient = new TestClient();
    expiredClient.cookies.token = 'invalid_malformed_expired_jwt_token';
    const expiredRes = await expiredClient.request('/api/auth/me');
    record(
      'Session Security: Invalid or expired JWT token is rejected (HTTP 401)',
      expiredRes.status === 401,
      expiredRes.data.message
    );

    // 10. Test Protected Officer Account Creation (Server-side invitation)
    // A. Unauthenticated / Student attempts to create officer -> 403
    const unauthCreateOfficer = await studentClient.request('/api/auth/officer/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker',
        email: 'hacker@college.edu',
        password: 'Password123!',
      }),
    });
    record(
      'Account Creation Security: Students/unauth cannot create officer accounts (HTTP 403)',
      unauthCreateOfficer.status === 403,
      unauthCreateOfficer.data.message
    );

    // B. Authenticated Officer provisions an assistant officer account
    const officerCreatesOfficer = await officerClient.request('/api/auth/officer/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Asst. Prof. Kiran Kumar',
        email: createdOfficerEmail,
        password: 'KiranOfficer@123',
      }),
    });
    const createdPassed =
      officerCreatesOfficer.status === 201 &&
      officerCreatesOfficer.data.officer?.role === 'officer' &&
      officerCreatesOfficer.data.officer?.password === undefined;
    record(
      'Officer Creation: Existing officer securely provisions new officer account',
      createdPassed,
      officerCreatesOfficer.data.message
    );

    // Verify newly created officer can log in at /api/auth/officer/login
    const newOfficerClient = new TestClient();
    const newOfficerLogin = await newOfficerClient.request('/api/auth/officer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: createdOfficerEmail,
        password: 'KiranOfficer@123',
      }),
    });
    record(
      'Newly provisioned officer can successfully authenticate at Officer Login',
      newOfficerLogin.status === 200 && newOfficerLogin.data.user?.role === 'officer',
      newOfficerLogin.data.message
    );

    // 11. Test Officer Logout (clears session cookie)
    const logoutRes = await officerClient.request('/api/auth/logout', { method: 'POST' });
    const logoutCookieHeader = logoutRes.headers.get('set-cookie') || '';
    const cookieCleared =
      logoutRes.status === 200 &&
      (logoutCookieHeader.includes('token=;') ||
        logoutCookieHeader.includes('Expires=Thu, 01 Jan 1970'));
    record(
      'Officer Logout: Clears HTTP-only session cookie (expires in 1970)',
      cookieCleared,
      logoutRes.data.message
    );

    // After logout, accessing officer dashboard must now be rejected
    const postLogoutDash = await officerClient.request('/api/users/officer/dashboard');
    record(
      'Post-Logout Protection: Officer dashboard access blocked after logout (HTTP 401)',
      postLogoutDash.status === 401,
      `Status: ${postLogoutDash.status}`
    );

  } catch (err) {
    console.error('Test Suite Unexpected Error:', err);
    record('Test Suite Run', false, err.message);
  } finally {
    // Cleanup temporary test users
    console.log('\n🧹 Cleaning up test users...');
    try {
      await User.deleteMany({ email: { $in: [testStudentEmail, createdOfficerEmail] } });
      console.log('✅ Temporary test users cleaned up.');
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }

    server.close();
    await mongoose.disconnect();

    console.log('\n===========================================================');
    console.log(` SUMMARY: ${results.passed}/${results.total} TESTS PASSED`);
    console.log(` FAILED: ${results.failed}`);
    console.log('===========================================================');
  }
};

run();

