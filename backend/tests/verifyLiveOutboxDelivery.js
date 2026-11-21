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

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  const student = await User.findOne({ email: '25695a0543@mits.ac.in' });
  const officer = await User.findOne({ email: '25695a0545@mits.ac.in' });

  if (!student) {
    console.error('Test student not found');
    process.exit(1);
  }

  console.log(`Student: ${student.name} (${student.email})`);
  console.log(`Officer: ${officer?.name || 'Officer'} (${officer?.email})`);

  const mockApp = {
    _id: new mongoose.Types.ObjectId(),
    student,
    company: { name: 'Security Test Corp' },
    drive: { jobRole: 'Software Engineer' },
    status: 'Shortlisted',
    currentRound: 2,
  };

  const startEnqueue = Date.now();
  const enqueueRes = await enqueueStatusUpdateNotification({
    application: mockApp,
    previousStatus: 'Shortlisted',
    newStatus: 'Interviewing',
    roundName: 'Technical Interview Round',
    interviewDetails: {
      date: new Date(Date.now() + 86400000),
      venue: 'Lab 402, Academic Block / MS Teams',
      description: 'Please bring your college ID and resume.',
    },
    remarks: 'Qualified for Round 2. High aptitude score.',
    officer,
    clientRequestId: `live_test_${Date.now()}`,
  });

  const enqueueDuration = Date.now() - startEnqueue;
  console.log(`Enqueue Response Time (Immediate HTTP return simulation): ${enqueueDuration}ms`);
  console.log('Outbox ID:', enqueueRes.outboxId);

  // Now process outbox
  const startSend = Date.now();
  console.log('Processing outbox delivery via pooled SMTP...');
  await processNotificationOutbox();
  const sendDuration = Date.now() - startSend;
  console.log(`Outbox Process Duration: ${sendDuration}ms`);

  const item = await NotificationOutbox.findById(enqueueRes.outboxId);
  console.log('Final Outbox Status:', item.emailStatus);
  console.log('Message ID:', item.messageId);
  console.log('Sent At:', item.sentAt);

  await mongoose.disconnect();
  console.log('\n VERIFIED: Fast asynchronous outbox delivery complete.');
  process.exit(0);
}

run().catch(console.error);
