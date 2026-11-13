import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import express app components
import connectDB from '../config/db.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Company from '../models/Company.js';
import PlacementDrive from '../models/PlacementDrive.js';
import Application from '../models/Application.js';
import Notification from '../models/Notification.js';

// Route imports
import authRoutes from '../routes/authRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import companyRoutes from '../routes/companyRoutes.js';
import driveRoutes from '../routes/driveRoutes.js';
import applicationRoutes from '../routes/applicationRoutes.js';
import notificationRoutes from '../routes/notificationRoutes.js';
import cookieParser from 'cookie-parser';

// Test statistics
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  bugsFound: [],
  details: [],
};

const recordTest = (name, category, passed, notes = '') => {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    testResults.failed++;
    testResults.bugsFound.push({ name, category, notes });
    console.log(`  ❌ [FAIL] ${name} - ${notes}`);
  }
  testResults.details.push({ name, category, passed, notes });
};

const run = async () => {
  console.log('===========================================================');
  console.log(' STUDENT PLACEMENT MANAGEMENT PORTAL - FULL TEST SUITE');
  console.log('===========================================================\n');

  // 1. Connect DB
  await connectDB();

  // 2. Setup test express server on port 5055
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/drives', driveRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/notifications', notificationRoutes);

  const TEST_PORT = 5055;
  const server = app.listen(TEST_PORT);
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  // Helper HTTP fetch with cookie persistence
  class TestClient {
    constructor() {
      this.cookies = {};
    }

    async request(urlPath, options = {}) {
      const headers = options.headers || {};
      
      // Inject cookies
      const cookieHeader = Object.entries(this.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
      }

      const res = await fetch(`${BASE_URL}${urlPath}`, {
        ...options,
        headers,
      });

      // Capture set-cookie
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
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      return { status: res.status, data, headers: res.headers };
    }
  }

  const studentClient = new TestClient();
  const officerClient = new TestClient();
  const unauthClient = new TestClient();

  const timestamp = Date.now();
  const testStudentEmail = `test_stu_${timestamp}@college.edu`;
  const testStudentRoll = `ROLL_${timestamp}`;
  let testStudentId = null;
  let testCompanyId = null;
  let testDriveId = null;
  let testApplicationId = null;

  try {
    // -------------------------------------------------------------
    // CATEGORY 1: SECURITY CHECKS (Pre-Authentication & Middleware)
    // -------------------------------------------------------------
    console.log('\n🔒 RUNNING SECURITY CHECKS...');

    // Sec 1: Unauthenticated access to protected route
    const unauthRes = await unauthClient.request('/api/users/profile');
    recordTest(
      'Prevent unauthenticated access to protected routes (HTTP 401)',
      'Security',
      unauthRes.status === 401,
      `Status: ${unauthRes.status}`
    );

    // Sec 2: Reject public registration with role=officer
    const evilOfficerReg = await unauthClient.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Officer',
        email: `hacker_${timestamp}@college.edu`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        rollNumber: `HACK_${timestamp}`,
        department: 'Computer Science',
        graduationYear: 2026,
        role: 'officer',
      }),
    });
    recordTest(
      'Prevent unauthorized public registration of officer role (HTTP 403)',
      'Security',
      evilOfficerReg.status === 403,
      `Status: ${evilOfficerReg.status}`
    );

    // Sec 3: Input validation - rejection of weak password / missing fields
    const invalidReg = await unauthClient.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '',
        email: 'bad-email-format',
        password: '123',
      }),
    });
    recordTest(
      'Strict input validation on student registration (HTTP 400)',
      'Security',
      invalidReg.status === 400,
      `Status: ${invalidReg.status}`
    );

    // -------------------------------------------------------------
    // CATEGORY 2: STUDENT FEATURE TESTS
    // -------------------------------------------------------------
    console.log('\n🎓 RUNNING STUDENT FEATURE TESTS...');

    // 1. Student Registration
    const regRes = await studentClient.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Candidate',
        email: testStudentEmail,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        rollNumber: testStudentRoll,
        department: 'Computer Science',
        graduationYear: 2026,
        batch: 2026,
      }),
    });
    const regPassed = regRes.status === 201 && regRes.data.success && regRes.data.user?.role === 'student';
    testStudentId = regRes.data.user?._id || regRes.data.user?.id;
    recordTest('Student Registration (creates User and StudentProfile)', 'Student', regPassed, regRes.data.message);

    // Sec 4: Verify password is not exposed in registration response
    recordTest(
      'Password hash is excluded from student registration response',
      'Security',
      regRes.data.user?.password === undefined,
      'Password field must be undefined'
    );

    // 2. Student Login & Session Cookie
    const loginRes = await studentClient.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudentEmail,
        password: 'TestPassword123!',
      }),
    });
    const loginPassed = loginRes.status === 200 && Boolean(studentClient.cookies.token);
    recordTest('Student Login (receives secure session cookie)', 'Student', loginPassed, loginRes.data.message);

    // 3. Profile Fetch & Profile Completion Calculation
    const profRes = await studentClient.request('/api/users/profile');
    const profPassed = profRes.status === 200 && profRes.data.profile?.email === testStudentEmail;
    recordTest('Fetch Student Profile with completion analysis', 'Student', profPassed, profRes.data.message);

    // 4. Update Student Profile
    const updateProfRes = await studentClient.request('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cgpa: 8.45,
        tenthPercentage: 88.5,
        twelfthPercentage: 86.0,
        activeBacklogs: 0,
        totalBacklogs: 0,
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Python'],
        phone: '9876543210',
        githubUrl: 'https://github.com/testcandidate',
        linkedinUrl: 'https://linkedin.com/in/testcandidate',
      }),
    });
    const updateProfPassed = updateProfRes.status === 200 && updateProfRes.data.profile?.cgpa === 8.45;
    recordTest('Update Student Profile (CGPA, marks, skills, URLs)', 'Student', updateProfPassed, updateProfRes.data.message);

    // 5. Upload PDF Resume
    // Create a temporary valid PDF file buffer
    const mockPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
    const formDataBoundary = '----WebKitFormBoundaryTest' + timestamp;
    const multipartBody = Buffer.concat([
      Buffer.from(`--${formDataBoundary}\r\nContent-Disposition: form-data; name="resume"; filename="Candidate_Resume.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      mockPdfBuffer,
      Buffer.from(`\r\n--${formDataBoundary}--\r\n`),
    ]);

    const resumeUploadRes = await studentClient.request('/api/users/profile/resume', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formDataBoundary}`,
      },
      body: multipartBody,
    });
    const resumeUploadPassed = resumeUploadRes.status === 200 && Boolean(resumeUploadRes.data.resume?.url);
    recordTest('Student Resume PDF Upload & Metadata Storage', 'Student', resumeUploadPassed, resumeUploadRes.data.message);

    // 6. Download Student Resume
    const resumeDownloadRes = await studentClient.request('/api/users/profile/resume/download');
    const resumeDownloadPassed = resumeDownloadRes.status === 200;
    recordTest('Student Resume Download', 'Student', resumeDownloadPassed, `Status: ${resumeDownloadRes.status}`);

    // -------------------------------------------------------------
    // CATEGORY 3: PLACEMENT OFFICER FEATURE TESTS
    // -------------------------------------------------------------
    console.log('\n👔 RUNNING PLACEMENT OFFICER FEATURE TESTS...');

    // 1. Officer Login
    const officerEmail = process.env.OFFICER_EMAIL || '25695a0545@mits.ac.in';
    const officerPassword = process.env.OFFICER_PASSWORD || 'sam@123';
    const officerLoginRes = await officerClient.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: officerEmail,
        password: officerPassword,
      }),
    });
    const officerLoginPassed = officerLoginRes.status === 200 && officerLoginRes.data.user?.role === 'officer';
    recordTest(`Officer Authentication (${officerEmail})`, 'Officer', officerLoginPassed, officerLoginRes.data.message);

    // Sec 5: Role-based authorization - Student blocked from Officer endpoints
    const studentBlockedRes = await studentClient.request('/api/users/officer/dashboard');
    recordTest(
      'Role Authorization: Student blocked from Officer Dashboard (HTTP 403)',
      'Security',
      studentBlockedRes.status === 403,
      `Status: ${studentBlockedRes.status}`
    );

    // 2. Officer Dashboard Analytics
    const officerDashRes = await officerClient.request('/api/users/officer/dashboard');
    const officerDashPassed = officerDashRes.status === 200 && officerDashRes.data.stats?.totalStudents !== undefined;
    recordTest('Officer Dashboard Analytics & Institutional KPIs', 'Officer', officerDashPassed, officerDashRes.data.message);

    // 3. Add Partner Company
    const companyRes = await officerClient.request('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Acme Global Corp ${timestamp}`,
        industry: 'Software & Cloud Services',
        website: 'https://acmeglobal.example.com',
        location: 'Bengaluru / Hyderabad',
        contactPerson: 'Sarah Jenkins',
        contactEmail: `sarah_${timestamp}@acmeglobal.example.com`,
        description: 'Global cloud infrastructure provider.',
      }),
    });
    const companyPassed = companyRes.status === 201 && Boolean(companyRes.data.company?._id);
    testCompanyId = companyRes.data.company?._id;
    recordTest('Officer: Register Partner Company', 'Officer', companyPassed, companyRes.data.message);

    // 4. Update Partner Company
    const updateCompanyRes = await officerClient.request(`/api/companies/${testCompanyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Acme Global Corp ${timestamp}`,
        website: 'https://acme-updated.example.com',
        contactPerson: 'Sarah Jenkins (VP Talent)',
      }),
    });
    const updateCompanyPassed = updateCompanyRes.status === 200 && updateCompanyRes.data.company?.contactPerson?.includes('VP Talent');
    recordTest('Officer: Update Partner Company profile', 'Officer', updateCompanyPassed, updateCompanyRes.data.message);

    // 5. Archive & Restore Partner Company
    const archiveRes = await officerClient.request(`/api/companies/${testCompanyId}/archive`, {
      method: 'PATCH',
    });
    const archivePassed = archiveRes.status === 200 && archiveRes.data.isArchived === true;
    recordTest('Officer: Archive Company (Soft archive)', 'Officer', archivePassed, archiveRes.data.message);

    // Restore back to active
    await officerClient.request(`/api/companies/${testCompanyId}/archive`, { method: 'PATCH' });

    // 6. Create Placement Drive (Draft)
    const driveRes = await officerClient.request('/api/drives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: testCompanyId,
        title: `Acme Cloud Engineer Drive ${timestamp}`,
        jobRole: 'Cloud Software Engineer',
        jobDescription: 'Build high-scale distributed systems and cloud platforms.',
        employmentType: 'Full-Time',
        packageLPA: 12.0,
        location: 'Bengaluru',
        vacancies: 10,
        requiredSkills: ['JavaScript', 'Node.js', 'Cloud'],
        applicationOpeningDate: new Date(Date.now() - 86400000).toISOString(),
        applicationClosingDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        status: 'Draft',
        eligibilityCriteria: {
          minCgpa: 7.5,
          minTenthPercentage: 70,
          minTwelfthPercentage: 70,
          allowedDepartments: ['Computer Science', 'Information Technology'],
          batch: 2026,
          maxActiveBacklogs: 0,
          maxTotalBacklogs: 1,
        },
      }),
    });
    const drivePassed = driveRes.status === 201 && Boolean(driveRes.data.drive?._id);
    testDriveId = driveRes.data.drive?._id;
    recordTest('Officer: Create Placement Drive (Draft mode)', 'Officer', drivePassed, driveRes.data.message);

    // Sec 6: Draft Drive hidden from Students
    const studentDrivesPre = await studentClient.request('/api/drives');
    const draftHidden = !studentDrivesPre.data.drives?.some((d) => d._id === testDriveId);
    recordTest('Visibility Rule: Draft drives hidden from student listing', 'Security', draftHidden, 'Draft drives must be hidden');

    // 7. Update Placement Drive
    const updateDriveRes = await officerClient.request(`/api/drives/${testDriveId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageLPA: 14.5,
      }),
    });
    const updateDrivePassed = updateDriveRes.status === 200 && updateDriveRes.data.drive?.packageLPA === 14.5;
    recordTest('Officer: Update Placement Drive (Package/Details)', 'Officer', updateDrivePassed, updateDriveRes.data.message);

    // 8. Publish Placement Drive
    const publishRes = await officerClient.request(`/api/drives/${testDriveId}/publish`, {
      method: 'PATCH',
    });
    const publishPassed = publishRes.status === 200 && publishRes.data.drive?.status === 'Published';
    recordTest('Officer: Publish Placement Drive live to students', 'Officer', publishPassed, publishRes.data.message);

    // -------------------------------------------------------------
    // CATEGORY 4: ELIGIBILITY & APPLICATION WORKFLOW TESTS
    // -------------------------------------------------------------
    console.log('\n📝 RUNNING APPLICATION & ELIGIBILITY WORKFLOW TESTS...');

    // 1. Student Views Published Drives and Checks Eligibility
    const studentDrivesPost = await studentClient.request('/api/drives');
    const liveDrive = studentDrivesPost.data.drives?.find((d) => d._id === testDriveId);
    const eligibilityPassed = Boolean(liveDrive) && liveDrive.isEligible === true;
    recordTest(
      'Automated Eligibility Evaluation (Student with 8.45 CGPA is eligible for 7.5+ cutoff)',
      'Eligibility',
      eligibilityPassed,
      liveDrive ? `isEligible: ${liveDrive.isEligible}` : 'Drive not found'
    );

    // 2. Student Submits Application
    const applyRes = await studentClient.request(`/api/applications/apply/${testDriveId}`, {
      method: 'POST',
    });
    const applyPassed = applyRes.status === 201 && Boolean(applyRes.data.application?._id);
    testApplicationId = applyRes.data.application?._id;
    recordTest('Student: Apply for eligible placement drive', 'Student', applyPassed, applyRes.data.message);

    // 3. Prevent Duplicate Application (API Level)
    const dupApplyRes = await studentClient.request(`/api/applications/apply/${testDriveId}`, {
      method: 'POST',
    });
    const dupApplyPassed = dupApplyRes.status === 400 && dupApplyRes.data.message?.includes('already applied');
    recordTest('Duplicate Prevention (API Level: HTTP 400 rejection)', 'Security', dupApplyPassed, dupApplyRes.data.message);

    // 4. Prevent Duplicate Application (Database Index Level)
    let dbIndexCaught = false;
    try {
      // Ensure index is built on collection
      try {
        await Application.collection.createIndex({ student: 1, drive: 1 }, { unique: true });
      } catch (idxErr) {
        console.warn('Index build note:', idxErr.message);
      }

      await Application.create({
        student: testStudentId,
        drive: testDriveId,
        company: testCompanyId,
        status: 'Applied',
      });
    } catch (err) {
      if (err.code === 11000 || err.message?.includes('E11000') || err.message?.includes('duplicate key')) {
        dbIndexCaught = true;
      } else {
        console.warn('Unexpected DB duplicate error:', err.message);
      }
    }
    recordTest(
      'Database Level Duplicate Prevention (MongoDB Compound Unique Index E11000)',
      'Security',
      dbIndexCaught,
      'Unique index on { student: 1, drive: 1 } must reject duplicate insert'
    );

    // 5. Student Views "My Applications"
    const myAppsRes = await studentClient.request('/api/applications/my-applications');
    const myAppFound = myAppsRes.status === 200 && myAppsRes.data.applications?.some((a) => a.drive?._id?.toString() === testDriveId?.toString());
    recordTest('Student: View submitted applications list', 'Student', myAppFound, `Count: ${myAppsRes.data.count}`);

    // 6. Officer Views Drive Applicants
    const applicantsRes = await officerClient.request(`/api/applications/drive/${testDriveId}`);
    const applicantFound = applicantsRes.status === 200 && (applicantsRes.data.applications || applicantsRes.data.applicants)?.some((a) => {
      const stuId = a.student?._id || a.student;
      return stuId?.toString() === testStudentId?.toString();
    });
    recordTest('Officer: View all applicants for a placement drive', 'Officer', applicantFound, `Count: ${applicantsRes.data.count}`);

    // 7. Officer Downloads Applicant Resume
    const officerResumeRes = await officerClient.request(`/api/applications/${testApplicationId}/resume`);
    const officerResumePassed = officerResumeRes.status === 200;
    recordTest('Officer: Download candidate resume from application snapshot', 'Officer', officerResumePassed, `Status: ${officerResumeRes.status}`);

    // 8. Officer Updates Application Status (to Shortlisted, then Selected)
    const shortlistRes = await officerClient.request(`/api/applications/${testApplicationId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Shortlisted',
        currentRound: 2,
        remarks: 'Cleared Round 1 Online Assessment with distinction.',
      }),
    });
    const shortlistPassed = shortlistRes.status === 200 && shortlistRes.data.application?.status === 'Shortlisted';
    recordTest('Officer: Update applicant status to Shortlisted (Round 2)', 'Officer', shortlistPassed, shortlistRes.data.message);

    const selectRes = await officerClient.request(`/api/applications/${testApplicationId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Selected',
        remarks: 'Selected for Cloud Engineer position with CTC 14.5 LPA.',
      }),
    });
    const selectPassed = selectRes.status === 200 && selectRes.data.application?.status === 'Selected';
    recordTest('Officer: Update applicant status to Selected (Hired)', 'Officer', selectPassed, selectRes.data.message);

    // 9. Status Audit Trail History
    const historyRes = await officerClient.request(`/api/applications/${testApplicationId}/history`);
    const historyPassed = historyRes.status === 200 && historyRes.data.history?.length >= 2;
    recordTest('Application Status Audit Trail & History Record', 'Officer', historyPassed, `Entries: ${historyRes.data.history?.length}`);

    // 10. Student Notifications Dispatch
    const notifsRes = await studentClient.request('/api/notifications');
    const hasApplicationNotifs = notifsRes.status === 200 && notifsRes.data.notifications?.length > 0;
    recordTest('Notification System: Real-time notification dispatch to student', 'Notification', hasApplicationNotifs, `Count: ${notifsRes.data.notifications?.length}`);

    // 11. Officer: Close Placement Drive
    const closeRes = await officerClient.request(`/api/drives/${testDriveId}/close`, {
      method: 'PATCH',
    });
    const closePassed = closeRes.status === 200 && closeRes.data.drive?.status === 'Closed';
    recordTest('Officer: Close placement drive applications', 'Officer', closePassed, closeRes.data.message);

    // Sec 7: Closed drive rejects new applications
    // (Create a second student to test applying to closed drive)
    const secondStuEmail = `test_stu2_${timestamp}@college.edu`;
    const secondStuClient = new TestClient();
    await secondStuClient.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second Student',
        email: secondStuEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        rollNumber: `ROLL2_${timestamp}`,
        department: 'Computer Science',
        graduationYear: 2026,
      }),
    });
    const applyClosedRes = await secondStuClient.request(`/api/applications/apply/${testDriveId}`, {
      method: 'POST',
    });
    const applyClosedBlocked = applyClosedRes.status === 400 && applyClosedRes.data.message?.includes('closed');
    recordTest('Enforce Closed Drive Application Freeze (HTTP 400)', 'Security', applyClosedBlocked, applyClosedRes.data.message);

    // 12. Student Directory Verification
    const studentsDirRes = await officerClient.request('/api/users/students?search=' + testStudentRoll);
    const studentFoundInDir = studentsDirRes.status === 200 && studentsDirRes.data.students?.some((s) => (s.user?.email || s.email) === testStudentEmail);
    recordTest('Officer: Search and inspect Student Directory by roll number', 'Officer', studentFoundInDir, `Total: ${studentsDirRes.data.count ?? studentsDirRes.data.total}`);

  } catch (error) {
    console.error('Test Suite Unexpected Failure:', error);
    recordTest('Test Suite Runner Execution', 'General', false, error.message);
  } finally {
    // Cleanup temporary test artifacts to keep database pristine
    console.log('\n🧹 CLEANING UP TEMPORARY TEST ENTITIES...');
    try {
      if (testApplicationId) await Application.deleteMany({ drive: testDriveId });
      if (testDriveId) await PlacementDrive.findByIdAndDelete(testDriveId);
      if (testCompanyId) await Company.findByIdAndDelete(testCompanyId);
      if (testStudentId) {
        await StudentProfile.deleteMany({ user: testStudentId });
        await User.findByIdAndDelete(testStudentId);
        await Notification.deleteMany({ recipient: testStudentId });
      }
      // Clean second student if created
      const secondUser = await User.findOne({ email: `test_stu2_${timestamp}@college.edu` });
      if (secondUser) {
        await StudentProfile.deleteMany({ user: secondUser._id });
        await User.findByIdAndDelete(secondUser._id);
      }
      console.log('✅ Temporary test data cleaned up successfully.');
    } catch (cleanErr) {
      console.warn('Cleanup warning:', cleanErr.message);
    }

    server.close();
    await mongoose.disconnect();

    console.log('\n===========================================================');
    console.log(` TEST SUMMARY: ${testResults.passed}/${testResults.total} TESTS PASSED`);
    console.log(` FAILED TESTS: ${testResults.failed}`);
    console.log('===========================================================');
  }
};

run();
