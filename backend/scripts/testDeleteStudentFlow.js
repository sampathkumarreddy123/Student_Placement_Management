import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import connectDB from '../config/db.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Application from '../models/Application.js';
import Notification from '../models/Notification.js';
import '../models/Company.js';
import '../models/PlacementDrive.js';
import { deleteStudentAccount } from '../controllers/userController.js';

// Helper to mock express req/res
const createMockReqRes = (params = {}, user = null) => {
  const req = {
    params,
    user,
  };
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  const next = (err) => {
    if (err) throw err;
  };
  return { req, res, next };
};

async function runTests() {
  console.log('🧪 Starting Placement Officer Delete Student Account Test Suite...\n');
  await connectDB();

  const timestamp = Date.now();
  const studentEmail = `delete_student_${timestamp}@mits.ac.in`;
  const officerEmail = `officer_test_${timestamp}@mits.ac.in`;

  let createdStudentUser = null;
  let createdStudentProfile = null;
  let createdOfficerUser = null;

  try {
    // 1. Create a mock officer
    createdOfficerUser = await User.create({
      name: 'Placement Officer Test',
      email: officerEmail,
      password: 'OfficerPassword123!',
      role: 'officer',
      isEmailVerified: true,
    });

    // 2. Create a mock student
    createdStudentUser = await User.create({
      name: 'Student To Be Deleted',
      email: studentEmail,
      password: 'StudentPassword123!',
      role: 'student',
      isEmailVerified: true,
    });

    createdStudentProfile = await StudentProfile.create({
      user: createdStudentUser._id,
      rollNumber: `DEL${timestamp.toString().slice(-6)}`,
      department: 'Computer Science',
      batch: 2026,
      cgpa: 8.5,
    });

    // Create a mock notification for the student
    await Notification.create({
      recipient: createdStudentUser._id,
      recipientRole: 'student',
      type: 'SYSTEM',
      title: 'Welcome',
      message: 'Welcome to the placement portal',
    });

    console.log('Test 1: Non-existent student deletion returns 404');
    {
      const fakeId = new mongoose.Types.ObjectId();
      const { req, res, next } = createMockReqRes({ id: fakeId }, { id: createdOfficerUser._id, role: 'officer' });
      await deleteStudentAccount(req, res, next);
      if (res.statusCode === 404) {
        console.log('  ✅ Passed: Returned 404 for non-existent student record.');
      } else {
        throw new Error(`Expected 404 but got ${res.statusCode}`);
      }
    }

    console.log('\nTest 2: Attempting to delete an Officer account via this endpoint is blocked with 403');
    {
      const { req, res, next } = createMockReqRes({ id: createdOfficerUser._id }, { id: createdOfficerUser._id, role: 'officer' });
      await deleteStudentAccount(req, res, next);
      if (res.statusCode === 403) {
        console.log('  ✅ Passed: Officer account deletion safely blocked with 403 Forbidden.');
      } else {
        throw new Error(`Expected 403 but got ${res.statusCode}`);
      }
    }

    console.log('\nTest 3: Placement Officer successfully deletes a student account by User ID');
    {
      const { req, res, next } = createMockReqRes({ id: createdStudentUser._id }, { id: createdOfficerUser._id, role: 'officer' });
      await deleteStudentAccount(req, res, next);
      if (res.statusCode === 200 && res.data.success) {
        console.log('  ✅ Passed: Deleted student successfully with message:', res.data.message);
      } else {
        throw new Error(`Expected 200 success but got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }

      // Verify User record was deleted
      const userCheck = await User.findById(createdStudentUser._id);
      if (!userCheck) {
        console.log('  ✅ Passed: User authentication document is deleted from database.');
      } else {
        throw new Error('User document was not deleted!');
      }

      // Verify StudentProfile was deleted
      const profileCheck = await StudentProfile.findById(createdStudentProfile._id);
      if (!profileCheck) {
        console.log('  ✅ Passed: StudentProfile document is deleted from database.');
      } else {
        throw new Error('StudentProfile document was not deleted!');
      }

      // Verify Notifications were deleted
      const notifCount = await Notification.countDocuments({ recipient: createdStudentUser._id });
      if (notifCount === 0) {
        console.log('  ✅ Passed: All student notifications were cascade-deleted.');
      } else {
        throw new Error('Student notifications were not cleaned up!');
      }
    }

    console.log('\nTest 4: Creating a student and deleting by StudentProfile ID');
    {
      const sUser2 = await User.create({
        name: 'Student 2 To Delete',
        email: `student2_${timestamp}@mits.ac.in`,
        password: 'PassWord123!',
        role: 'student',
        isEmailVerified: true,
      });

      const sProf2 = await StudentProfile.create({
        user: sUser2._id,
        rollNumber: `DEL2${timestamp.toString().slice(-5)}`,
        department: 'Information Technology',
        batch: 2026,
        cgpa: 7.9,
      });

      const { req, res, next } = createMockReqRes({ id: sProf2._id }, { id: createdOfficerUser._id, role: 'officer' });
      await deleteStudentAccount(req, res, next);
      if (res.statusCode === 200 && res.data.success) {
        console.log('  ✅ Passed: Student deleted by Profile ID successfully.');
      } else {
        throw new Error(`Expected 200 success but got: ${JSON.stringify(res.data)}`);
      }

      const uCheck = await User.findById(sUser2._id);
      const pCheck = await StudentProfile.findById(sProf2._id);
      if (!uCheck && !pCheck) {
        console.log('  ✅ Passed: Both User and StudentProfile deleted cleanly.');
      } else {
        throw new Error('Records were not deleted by profile id!');
      }
    }

    console.log('\n Cleaning up test officer...');
    await User.findByIdAndDelete(createdOfficerUser._id);
    console.log('  ✅ Officer cleanup complete.');

    console.log('\n🎉 ALL DELETE STUDENT ACCOUNT PERMISSION TESTS PASSED!\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed with error:', err);
    if (createdOfficerUser) await User.findByIdAndDelete(createdOfficerUser._id);
    if (createdStudentUser) await User.findByIdAndDelete(createdStudentUser._id);
    if (createdStudentProfile) await StudentProfile.findByIdAndDelete(createdStudentProfile._id);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
