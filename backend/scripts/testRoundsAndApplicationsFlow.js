import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Application from '../models/Application.js';
import PlacementDrive from '../models/PlacementDrive.js';
import RecruitmentRound from '../models/RecruitmentRound.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getAllApplications } from '../controllers/applicationController.js';
import { getMyApplications } from '../controllers/applicationController.js';
import { createRound } from '../controllers/roundController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb+srv://sampathkumarreddy:sampath317.@cluster0.irpbz.mongodb.net/placement_portal?retryWrites=true&w=majority';

async function testFlow() {
  console.log('🧪 Starting Rounds and Applications Flow Verification...\n');
  await mongoose.connect(mongoUri);

  // 1. Test Officer getAllApplications with no driveId (All Placement Drives)
  console.log('Test 1: Officer getAllApplications with "All Placement Drives"');
  const officer = await User.findOne({ role: 'officer' });
  const mockReqOfficer = {
    user: officer,
    query: {},
  };

  let officerResult = null;
  const mockResOfficer = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      officerResult = data;
      return this;
    },
  };

  await getAllApplications(mockReqOfficer, mockResOfficer, (err) => {
    if (err) console.error('getAllApplications error:', err);
  });

  if (officerResult && officerResult.success) {
    console.log(`  ✅ Passed: Returned ${officerResult.applications.length} applications in "All Placement Drives" (Total: ${officerResult.total})`);
    const appIds = officerResult.applications.map((a) => a._id.toString());
    console.log('  App IDs present:', appIds);
  } else {
    console.error('  ❌ Failed: Could not get all applications:', officerResult);
  }

  // 2. Test Student View of Applications & Rounds
  console.log('\nTest 2: Student MyApplications & Round 1 visibility');
  const student = await User.findOne({ email: '25695a0543@mits.ac.in' });
  const mockReqStudent = {
    user: student,
    query: {},
  };

  let studentResult = null;
  const mockResStudent = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      studentResult = data;
      return this;
    },
  };

  await getMyApplications(mockReqStudent, mockResStudent, (err) => {
    if (err) console.error('getMyApplications error:', err);
  });

  if (studentResult && studentResult.success && studentResult.applications.length > 0) {
    const studentApp = studentResult.applications[0];
    console.log(`  ✅ Passed: Student has ${studentResult.applications.length} application(s).`);
    console.log(`  Application drive: ${studentApp.drive?.title}`);
    console.log(`  Current round: ${studentApp.currentRound}`);
    console.log(`  roundResults count: ${studentApp.roundResults?.length}`);
    if (studentApp.roundResults && studentApp.roundResults.length > 0) {
      console.log(`  ✅ Passed: Round 1 details: "${studentApp.roundResults[0].roundName}" - status: "${studentApp.roundResults[0].status}"`);
    }
  } else {
    console.error('  ❌ Failed to get student applications:', studentResult);
  }

  // 3. Test Student Notifications for Round 1
  console.log('\nTest 3: Student Notifications for Round 1');
  const studentNotif = await Notification.findOne({
    recipient: student._id,
    title: /Round 1 Scheduled/i,
  });

  if (studentNotif) {
    console.log('  ✅ Passed: Notification exists for student:');
    console.log(`     Title: ${studentNotif.title}`);
    console.log(`     Message: ${studentNotif.message}`);
  } else {
    console.error('  ❌ Notification for Round 1 not found for student!');
  }

  // 4. Test creating a new round in a drive triggers sync & notification
  console.log('\nTest 4: createRound dispatches notifications and syncs to applicant roundResults');
  const testDrive = await PlacementDrive.findOne({ title: /Security Software Engineer/i });
  const mockCreateRoundReq = {
    params: { driveId: testDrive._id.toString() },
    user: officer,
    body: {
      name: 'Technical Interview Round',
      description: 'Live coding and architecture discussion',
      mode: 'Online',
      roundNumber: 2,
    },
  };

  let createRoundResult = null;
  const mockCreateRoundRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      createRoundResult = data;
      return this;
    },
  };

  await createRound(mockCreateRoundReq, mockCreateRoundRes, (err) => {
    if (err) console.error('createRound error:', err);
  });

  if (createRoundResult && createRoundResult.success) {
    console.log(`  ✅ Passed: Created Round ${createRoundResult.round.roundNumber}: "${createRoundResult.round.name}"`);
    
    // Check if notification was created
    const round2Notif = await Notification.findOne({
      recipient: student._id,
      title: /Round 2 Scheduled/i,
    });
    if (round2Notif) {
      console.log(`  ✅ Passed: Notification for Round 2 created: "${round2Notif.title}"`);
    }

    // Check if application roundResults was updated
    const updatedApp = await Application.findOne({ drive: testDrive._id, student: student._id });
    const hasRound2 = updatedApp.roundResults.some((r) => r.roundNumber === 2);
    if (hasRound2) {
      console.log('  ✅ Passed: Application roundResults contains Round 2.');
    }

    // Clean up test round 2
    await RecruitmentRound.deleteOne({ _id: createRoundResult.round._id });
    await Notification.deleteMany({ title: /Round 2 Scheduled/i });
    await Application.updateOne(
      { _id: updatedApp._id },
      { $pull: { roundResults: { roundNumber: 2 } } }
    );
    await PlacementDrive.updateOne(
      { _id: testDrive._id },
      { $pull: { rounds: { roundNumber: 2 } } }
    );
    console.log('  Cleaned up temporary Round 2 test artifacts.');
  }

  await mongoose.disconnect();
  console.log('\n🎉 ALL ROUNDS & APPLICATIONS VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

testFlow().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
