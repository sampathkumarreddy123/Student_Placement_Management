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

async function run() {
  console.log('[Fix Script] Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('[Fix Script] Connected.');

  const db = mongoose.connection.db;

  // 1. Find default officer
  const officer = await db.collection('users').findOne({ role: 'officer' });
  const officerId = officer ? officer._id : new mongoose.Types.ObjectId('6af71c37d2028c2d90c56e65');
  console.log('[Fix Script] Using Officer ID:', officerId);

  // 2. Fix drives with missing createdBy
  const driveUpdateRes = await db.collection('placementdrives').updateMany(
    { createdBy: { $in: [null, undefined] } },
    { $set: { createdBy: officerId } }
  );
  console.log(`[Fix Script] Updated ${driveUpdateRes.modifiedCount} drives with missing createdBy.`);

  // 3. Sync recruitment rounds to application roundResults
  const allRounds = await db.collection('recruitmentrounds').find({}).toArray();
  console.log(`[Fix Script] Found ${allRounds.length} recruitment rounds in DB.`);

  for (const round of allRounds) {
    const apps = await db.collection('applications').find({ drive: round.drive }).toArray();
    for (const app of apps) {
      const hasRound = app.roundResults?.some(
        (r) => String(r.round) === String(round._id) || r.roundNumber === round.roundNumber
      );
      if (!hasRound) {
        await db.collection('applications').updateOne(
          { _id: app._id },
          {
            $push: {
              roundResults: {
                round: round._id,
                roundNumber: round.roundNumber,
                roundName: round.name,
                status: 'Pending',
                remarks: round.description || '',
                evaluatedAt: new Date(),
                _id: new mongoose.Types.ObjectId(),
              },
            },
          }
        );
        console.log(`[Fix Script] Added Round ${round.roundNumber} (${round.name}) to application ${app._id}`);
      }
    }
  }

  // 4. Send missing notification for Security Software Engineer Drive (Round 1: Online Assessment)
  const targetDrive = await db.collection('placementdrives').findOne({ title: /Security Software Engineer/i });
  if (targetDrive) {
    const targetRound = await db.collection('recruitmentrounds').findOne({ drive: targetDrive._id, roundNumber: 1 });
    const targetApp = await db.collection('applications').findOne({ drive: targetDrive._id });

    if (targetRound && targetApp) {
      const studentId = targetApp.student;
      const existingNotif = await db.collection('notifications').findOne({
        recipient: studentId,
        title: /Round 1 Scheduled/i,
      });

      if (!existingNotif) {
        const notif = {
          recipient: studentId,
          recipientRole: 'student',
          type: 'APPLICATION_STATUS_CHANGED',
          title: `Round 1 Scheduled: ${targetRound.name}`,
          message: `Round 1 (${targetRound.name}) has been scheduled for "${targetDrive.jobRole}". Mode: ${targetRound.mode || 'Online'}${targetRound.date ? ` on ${new Date(targetRound.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}.${targetRound.venue ? ` Venue: ${targetRound.venue}` : ''}${targetRound.description ? ` Details: ${targetRound.description}` : ''}`,
          link: '/student/applications',
          isRead: false,
          readAt: null,
          relatedId: targetApp._id,
          relatedModel: 'Application',
          eventKey: `ROUND_ANNOUNCE_${targetRound._id}_${studentId}`,
          metadata: {
            driveId: targetDrive._id,
            applicationId: targetApp._id,
            roundNumber: targetRound.roundNumber,
            roundName: targetRound.name,
            mode: targetRound.mode,
            date: targetRound.date,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.collection('notifications').insertOne(notif);
        console.log('[Fix Script] Successfully created round notification for student:', studentId);
      } else {
        console.log('[Fix Script] Notification already exists.');
      }
    }
  }

  // 5. Verify total applications query across all placement drives
  const allApps = await db.collection('applications').find({}).toArray();
  console.log(`[Fix Script] Total applications across all placement drives: ${allApps.length}`);

  await mongoose.disconnect();
  console.log('[Fix Script] Finished successfully.');
}

run().catch((err) => {
  console.error('[Fix Script Error]', err);
  process.exit(1);
});
