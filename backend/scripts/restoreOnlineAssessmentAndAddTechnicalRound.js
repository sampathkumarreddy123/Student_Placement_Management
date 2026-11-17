import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb+srv://sampathkumarreddy:sampath317.@cluster0.irpbz.mongodb.net/placement_portal?retryWrites=true&w=majority';

async function fix() {
  console.log('[Fix] Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('[Fix] Connected.');

  const db = mongoose.connection.db;

  const targetDrive = await db.collection('placementdrives').findOne({ title: /Security Software Engineer/i });
  if (!targetDrive) {
    console.error('Target drive not found!');
    process.exit(1);
  }
  console.log('[Fix] Found drive:', targetDrive._id, targetDrive.title);

  const officer = await db.collection('users').findOne({ role: 'officer' });
  const officerId = officer ? officer._id : new mongoose.Types.ObjectId('6af71c37d2028c2d90c56e65');

  // 1. Ensure Round 1 is "Online Assessment"
  let round1 = await db.collection('recruitmentrounds').findOne({
    drive: targetDrive._id,
    roundNumber: 1,
  });

  if (round1) {
    await db.collection('recruitmentrounds').updateOne(
      { _id: round1._id },
      {
        $set: {
          name: 'Online Assessment',
          description: 'Aptitude and core computer science concepts evaluation.',
          mode: 'Online',
          status: 'Completed',
          updatedAt: new Date(),
        },
      }
    );
    console.log('[Fix] Restored Round 1 to "Online Assessment" (Completed).');
  } else {
    const insertRes = await db.collection('recruitmentrounds').insertOne({
      drive: targetDrive._id,
      roundNumber: 1,
      name: 'Online Assessment',
      description: 'Aptitude and core computer science concepts evaluation.',
      mode: 'Online',
      status: 'Completed',
      createdBy: officerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    round1 = { _id: insertRes.insertedId };
    console.log('[Fix] Created Round 1 "Online Assessment".');
  }

  // 2. Ensure Round 2 is "Technical Interview 1"
  let round2 = await db.collection('recruitmentrounds').findOne({
    drive: targetDrive._id,
    roundNumber: 2,
  });

  const round2Date = new Date('2026-11-20T10:00:00.000Z');

  if (round2) {
    await db.collection('recruitmentrounds').updateOne(
      { _id: round2._id },
      {
        $set: {
          name: 'Technical Interview 1',
          description: 'Data structures, algorithms, and system design live interview.',
          date: round2Date,
          mode: 'Online',
          status: 'Scheduled',
          updatedAt: new Date(),
        },
      }
    );
    console.log('[Fix] Updated existing Round 2 to "Technical Interview 1" (Scheduled).');
  } else {
    const insertRes2 = await db.collection('recruitmentrounds').insertOne({
      drive: targetDrive._id,
      roundNumber: 2,
      name: 'Technical Interview 1',
      description: 'Data structures, algorithms, and system design live interview.',
      date: round2Date,
      mode: 'Online',
      venue: '',
      isFinalRound: false,
      status: 'Scheduled',
      createdBy: officerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    round2 = { _id: insertRes2.insertedId };
    console.log('[Fix] Created Round 2 "Technical Interview 1".');
  }

  // 3. Update PlacementDrive.rounds embedded array
  await db.collection('placementdrives').updateOne(
    { _id: targetDrive._id },
    {
      $set: {
        rounds: [
          {
            _id: round1._id,
            roundNumber: 1,
            roundName: 'Online Assessment',
            description: 'Aptitude and core computer science concepts evaluation.',
            mode: 'Online',
            status: 'Completed',
          },
          {
            _id: round2._id,
            roundNumber: 2,
            roundName: 'Technical Interview 1',
            description: 'Data structures, algorithms, and system design live interview.',
            date: round2Date,
            mode: 'Online',
            status: 'Scheduled',
          },
        ],
      },
    }
  );
  console.log('[Fix] Updated PlacementDrive.rounds with both Round 1 & Round 2.');

  // 4. Update the candidate Application
  const targetApp = await db.collection('applications').findOne({ drive: targetDrive._id });
  if (targetApp) {
    await db.collection('applications').updateOne(
      { _id: targetApp._id },
      {
        $set: {
          currentRound: 2,
          status: 'Shortlisted',
          officerNotes: 'Cleared Round 1 (Online Assessment). Qualified for Round 2 (Technical Interview 1).',
          roundResults: [
            {
              round: round1._id,
              roundNumber: 1,
              roundName: 'Online Assessment',
              status: 'Passed',
              remarks: 'Cleared Round 1 (Online Assessment).',
              evaluatedBy: officerId,
              evaluatedAt: new Date(),
              _id: new mongoose.Types.ObjectId(),
            },
            {
              round: round2._id,
              roundNumber: 2,
              roundName: 'Technical Interview 1',
              status: 'Pending',
              remarks: 'Scheduled for live technical interview.',
              evaluatedAt: new Date(),
              _id: new mongoose.Types.ObjectId(),
            },
          ],
        },
      }
    );
    console.log('[Fix] Updated application: currentRound = 2, Round 1 = Passed, Round 2 = Pending.');

    // 5. Create notification for Round 2: Technical Interview 1
    const studentId = targetApp.student;
    await db.collection('notifications').deleteMany({
      recipient: studentId,
      title: /Technical Interview/i,
    });

    const notif = {
      recipient: studentId,
      recipientRole: 'student',
      type: 'APPLICATION_STATUS_CHANGED',
      title: 'Round 2 Scheduled: Technical Interview 1',
      message: 'Round 2 (Technical Interview 1) has been scheduled for "Software Engineer" at Security Test Corp. Mode: Online on Nov 20, 2026, 03:30 PM.',
      link: '/student/applications',
      isRead: false,
      readAt: null,
      relatedId: targetApp._id,
      relatedModel: 'Application',
      eventKey: `ROUND_ANNOUNCE_${round2._id}_${studentId}`,
      metadata: {
        driveId: targetDrive._id,
        applicationId: targetApp._id,
        roundNumber: 2,
        roundName: 'Technical Interview 1',
        mode: 'Online',
        date: round2Date,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('notifications').insertOne(notif);
    console.log('[Fix] Created notification for Round 2 (Technical Interview 1).');
  }

  // 6. Verify result
  const updatedApp = await db.collection('applications').findOne({ _id: targetApp._id });
  console.log('\n--- VERIFICATION ---');
  console.log('Application ID:', updatedApp._id);
  console.log('Current Stage / currentRound:', updatedApp.currentRound);
  console.log('Status:', updatedApp.status);
  console.log('Officer Notes:', updatedApp.officerNotes);
  console.log('Round Results:');
  for (const r of updatedApp.roundResults) {
    console.log(`  Round ${r.roundNumber} (${r.roundName}): [${r.status}]`);
  }

  await mongoose.disconnect();
  console.log('\n[Fix] Finished successfully!');
}

fix().catch((err) => {
  console.error('[Fix Error]', err);
  process.exit(1);
});
