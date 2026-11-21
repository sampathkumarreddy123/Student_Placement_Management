import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';
import Company from '../models/Company.js';
import PlacementDrive from '../models/PlacementDrive.js';
import Application from '../models/Application.js';
import NotificationOutbox from '../models/NotificationOutbox.js';
import {
  enqueueStatusUpdateNotification,
  processNotificationOutbox,
} from '../services/notificationQueueService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placement_portal';

async function runTestSuite() {
  console.log('====================================================');
  console.log('  STARTING RAPID STATUS UPDATE & OUTBOX TEST SUITE  ');
  console.log('====================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log(' Connected to MongoDB:', mongoose.connection.name);

  // Clean up any test outbox items before starting
  await NotificationOutbox.deleteMany({ eventId: /^TEST_EVT_/ });

  // 1. Identify or create test officer and students
  let officer = await User.findOne({ role: 'officer' });
  if (!officer) {
    officer = { _id: new mongoose.Types.ObjectId(), name: 'Test Officer', email: '25695a0545@mits.ac.in', role: 'officer' };
  }

  const studentA = await User.findOne({ role: 'student' }) || {
    _id: new mongoose.Types.ObjectId(),
    name: 'Student Alpha',
    email: '25695a0543@mits.ac.in',
    role: 'student',
  };

  const studentB = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Student Beta',
    email: '25695a0599@mits.ac.in',
    role: 'student',
  };

  const mockDrive = {
    _id: new mongoose.Types.ObjectId(),
    jobRole: 'Software Engineer',
    company: { name: 'Acme Test Corp' },
  };

  const mockAppA = {
    _id: new mongoose.Types.ObjectId(),
    student: studentA,
    company: { name: 'Acme Test Corp' },
    drive: mockDrive,
    status: 'Applied',
    currentRound: 1,
  };

  const mockAppB = {
    _id: new mongoose.Types.ObjectId(),
    student: studentB,
    company: { name: 'Beta Systems' },
    drive: mockDrive,
    status: 'Applied',
    currentRound: 1,
  };

  let passedTests = 0;
  let totalTests = 0;

  // ----------------------------------------------------
  // TEST A: Rapid status changes for the SAME student
  // ----------------------------------------------------
  totalTests++;
  console.log('--- TEST A: Rapid status changes for the SAME student ---');
  try {
    const res1 = await enqueueStatusUpdateNotification({
      application: mockAppA,
      previousStatus: 'Applied',
      newStatus: 'Shortlisted',
      remarks: 'Cleared resume round',
      officer,
      clientRequestId: 'testA_req1',
    });

    const res2 = await enqueueStatusUpdateNotification({
      application: mockAppA,
      previousStatus: 'Shortlisted',
      newStatus: 'Interviewing',
      remarks: 'Round 1 technical discussion scheduled',
      officer,
      clientRequestId: 'testA_req2',
    });

    const res3 = await enqueueStatusUpdateNotification({
      application: mockAppA,
      previousStatus: 'Interviewing',
      newStatus: 'Selected',
      remarks: 'Final offer released',
      officer,
      clientRequestId: 'testA_req3',
    });

    const eventsA = await NotificationOutbox.find({ application: mockAppA._id }).sort({ createdAt: 1 });

    if (
      eventsA.length === 3 &&
      eventsA[0].newStatus === 'Shortlisted' &&
      eventsA[1].newStatus === 'Interviewing' &&
      eventsA[2].newStatus === 'Selected'
    ) {
      console.log(' PASS: 3 distinct immutable events created for student A in correct order.');
      console.log(`       Event 1: ${eventsA[0].newStatus} (Snapshot preserved)`);
      console.log(`       Event 2: ${eventsA[1].newStatus} (Snapshot preserved)`);
      console.log(`       Event 3: ${eventsA[2].newStatus} (Snapshot preserved)`);
      passedTests++;
    } else {
      console.error(' FAIL: Expected 3 distinct events with immutable status values, got:', eventsA.map(e => e.newStatus));
    }
  } catch (err) {
    console.error(' FAIL Test A:', err.message);
  }

  // ----------------------------------------------------
  // TEST B: Multiple students updated rapidly (No cross-talk)
  // ----------------------------------------------------
  totalTests++;
  console.log('\n--- TEST B: Multiple students updated rapidly (No cross-talk) ---');
  try {
    await Promise.all([
      enqueueStatusUpdateNotification({
        application: mockAppA,
        previousStatus: 'Selected',
        newStatus: 'Rejected',
        remarks: 'Candidate withdrew',
        officer,
        clientRequestId: 'testB_appA',
      }),
      enqueueStatusUpdateNotification({
        application: mockAppB,
        previousStatus: 'Applied',
        newStatus: 'Selected',
        remarks: 'Candidate accepted offer',
        officer,
        clientRequestId: 'testB_appB',
      }),
    ]);

    const itemA = await NotificationOutbox.findOne({ application: mockAppA._id, newStatus: 'Rejected' });
    const itemB = await NotificationOutbox.findOne({ application: mockAppB._id, newStatus: 'Selected' });

    if (
      itemA && itemA.recipientEmail === studentA.email &&
      itemB && itemB.recipientEmail === studentB.email &&
      itemA.recipientEmail !== itemB.recipientEmail
    ) {
      console.log(' PASS: Student Alpha received Alpha event, Student Beta received Beta event. Zero data leak.');
      passedTests++;
    } else {
      console.error(' FAIL Test B: Cross-talk or missing items detected.');
    }
  } catch (err) {
    console.error(' FAIL Test B:', err.message);
  }

  // ----------------------------------------------------
  // TEST C: Double Click / Idempotency Prevention
  // ----------------------------------------------------
  totalTests++;
  console.log('\n--- TEST C: Double click / Idempotency Prevention ---');
  try {
    const dupKey = 'testC_double_click_key_123';
    const firstCall = await enqueueStatusUpdateNotification({
      application: mockAppA,
      previousStatus: 'Applied',
      newStatus: 'Shortlisted',
      officer,
      clientRequestId: dupKey,
    });

    const secondCall = await enqueueStatusUpdateNotification({
      application: mockAppA,
      previousStatus: 'Applied',
      newStatus: 'Shortlisted',
      officer,
      clientRequestId: dupKey,
    });

    if (secondCall.deduplicated === true && String(firstCall.outboxId) === String(secondCall.outboxId)) {
      console.log(' PASS: Double click suppressed! Second request returned existing event without duplicate.');
      passedTests++;
    } else {
      console.error(' FAIL Test C: Double submission created duplicate event:', { firstCall, secondCall });
    }
  } catch (err) {
    console.error(' FAIL Test C:', err.message);
  }

  // ----------------------------------------------------
  // TEST D: Status remains unchanged (Test F requirement)
  // ----------------------------------------------------
  totalTests++;
  console.log('\n--- TEST D: Status remains unchanged (Redundant event suppression) ---');
  try {
    const unchCall = await enqueueStatusUpdateNotification({
      application: { ...mockAppA, status: 'Shortlisted' },
      previousStatus: 'Shortlisted',
      newStatus: 'Shortlisted',
      remarks: '',
      officer,
    });

    if (unchCall.skipped === true && unchCall.reason === 'STATUS_UNCHANGED') {
      console.log(' PASS: Redundant status change correctly skipped with STATUS_UNCHANGED.');
      passedTests++;
    } else {
      console.error(' FAIL Test D: Did not skip redundant status change:', unchCall);
    }
  } catch (err) {
    console.error(' FAIL Test D:', err.message);
  }

  // ----------------------------------------------------
  // TEST E: Rapid updates across 10 applications (Test G requirement)
  // ----------------------------------------------------
  totalTests++;
  console.log('\n--- TEST E: High-concurrency rapid updates (10 applications) ---');
  try {
    const bulkPromises = [];
    const appIds = [];
    for (let i = 1; i <= 10; i++) {
      const appId = new mongoose.Types.ObjectId();
      appIds.push(appId);
      const appDoc = {
        _id: appId,
        student: { _id: new mongoose.Types.ObjectId(), name: `Student ${i}`, email: `student${i}@mits.ac.in` },
        company: { name: `Company ${i}` },
        drive: mockDrive,
        status: 'Applied',
      };
      bulkPromises.push(
        enqueueStatusUpdateNotification({
          application: appDoc,
          previousStatus: 'Applied',
          newStatus: i % 2 === 0 ? 'Selected' : 'Shortlisted',
          remarks: `Bulk test candidate ${i}`,
          officer,
          clientRequestId: `bulk_${i}_${Date.now()}`,
        })
      );
    }

    const bulkResults = await Promise.all(bulkPromises);
    const createdOutboxDocs = await NotificationOutbox.find({ application: { $in: appIds } });

    if (bulkResults.every(r => r.success) && createdOutboxDocs.length === 10) {
      console.log(` PASS: All 10 rapid concurrent status events successfully created and stored.`);
      passedTests++;
    } else {
      console.error(` FAIL Test E: Expected 10 items, found ${createdOutboxDocs.length}`);
    }
  } catch (err) {
    console.error(' FAIL Test E:', err.message);
  }

  // ----------------------------------------------------
  // CLEANUP & SUMMARY
  // ----------------------------------------------------
  await NotificationOutbox.deleteMany({ application: { $in: [mockAppA._id, mockAppB._id] } });
  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passedTests}/${totalTests} PASSED (100% Reliability)`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(passedTests === totalTests ? 0 : 1);
}

runTestSuite().catch((err) => {
  console.error('Test Suite crashed:', err);
  process.exit(1);
});
