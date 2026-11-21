import NotificationOutbox from '../models/NotificationOutbox.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import PlacementDrive from '../models/PlacementDrive.js';
import Application from '../models/Application.js';
import emailService from './emailService.js';

let isWorkerRunning = false;
let workerIntervalId = null;

/**
 * Sanitizes errors for safe database storage and logging without leaking sensitive credentials
 */
const sanitizeError = (err) => {
  if (!err) return 'Unknown delivery error';
  const raw = typeof err === 'string' ? err : err.message || String(err);
  return raw
    .replace(/(password|pass|secret|token)=([^\s&]+)/gi, '$1=***')
    .slice(0, 500);
};

/**
 * 1. Enqueue a status update notification event with an immutable snapshot.
 * Immediately saves to MongoDB outbox and returns without waiting for SMTP.
 */
export const enqueueStatusUpdateNotification = async ({
  application,
  previousStatus,
  newStatus,
  remarks = '',
  officer = null,
  roundNumber = null,
  roundName = '',
  interviewDetails = null,
  clientRequestId = null,
}) => {
  try {
    if (!application || !newStatus) {
      throw new Error('Application and newStatus are required to enqueue notification.');
    }

    const prev = String(previousStatus || application.status || '').trim();
    const curr = String(newStatus).trim();
    const cleanRemarks = String(remarks || '').trim();

    // Prevent redundant status-change notifications if status is unchanged and no new feedback/rounds
    if (prev === curr && !cleanRemarks && !roundName) {
      console.log(`[Notification Outbox] Status unchanged (${curr}) with no remarks/round for App ${application._id}. Skipping redundant email.`);
      return { skipped: true, reason: 'STATUS_UNCHANGED' };
    }

    // Resolve Student User
    let studentUser = application.student;
    if (!studentUser?.email && application.student) {
      const sId = application.student._id || application.student;
      studentUser = await User.findById(sId).select('_id name email');
    }

    if (!studentUser?.email) {
      console.warn(`[Notification Outbox Warning] No valid student email found for Application ${application._id}.`);
      return { skipped: true, reason: 'STUDENT_EMAIL_MISSING' };
    }

    // Resolve Company Name and Job Role
    let companyName = application.company?.name || application.drive?.company?.name;
    let jobRole = application.drive?.jobRole;

    if (!companyName && application.company) {
      const compId = application.company._id || application.company;
      const comp = await Company.findById(compId).select('name');
      companyName = comp?.name;
    }

    if ((!jobRole || !companyName) && application.drive) {
      const driveId = application.drive._id || application.drive;
      const driveDoc = await PlacementDrive.findById(driveId).populate('company', 'name').select('jobRole company');
      if (driveDoc) {
        if (!jobRole) jobRole = driveDoc.jobRole;
        if (!companyName && driveDoc.company?.name) companyName = driveDoc.company.name;
      }
    }

    companyName = companyName || 'Company';
    jobRole = jobRole || 'Position';

    // Construct Idempotency Key (prevents double-clicks & rapid duplicate submissions)
    const timeWindow = Math.floor(Date.now() / 4000); // 4-second deduplication bucket
    const idempotencyKey = clientRequestId
      ? `IDEMP_${application._id}_${clientRequestId}`
      : `IDEMP_${application._id}_${curr}_${roundName ? `${roundName}_` : ''}${timeWindow}`;

    // Check if duplicate event was already created within this window
    const existing = await NotificationOutbox.findOne({ idempotencyKey });
    if (existing) {
      console.log(`[Notification Outbox] Duplicate request suppressed by idempotency key: ${idempotencyKey}`);
      return {
        outboxId: existing._id,
        eventId: existing.eventId,
        emailStatus: existing.emailStatus,
        recipient: existing.recipientEmail,
        deduplicated: true,
      };
    }

    const eventId = `EVT_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Immutable Snapshot
    const snapshot = {
      eventId,
      idempotencyKey,
      application: application._id,
      student: studentUser._id,
      recipientEmail: studentUser.email.trim().toLowerCase(),
      studentName: studentUser.name || 'Candidate',
      companyName,
      jobRole,
      previousStatus: prev,
      newStatus: curr,
      remarks: cleanRemarks,
      roundNumber: roundNumber !== null ? Number(roundNumber) : application.currentRound || null,
      roundName: roundName || '',
      interviewDetails: interviewDetails || {},
      officer: {
        _id: officer?._id || null,
        name: officer?.name || 'MITS Placement Officer',
        email: officer?.email || '25695a0545@mits.ac.in',
      },
      portalUrl: `/student/applications?id=${application._id}`,
      statusTimestamp: new Date(),
      emailStatus: 'pending',
      attempts: 0,
      maxAttempts: 3,
      nextAttemptAt: new Date(),
    };

    const outboxDoc = await NotificationOutbox.create(snapshot);

    // Also create in-app notification for student portal
    try {
      let notifType = 'APPLICATION_STATUS_CHANGED';
      if (curr === 'Selected') notifType = 'APPLICATION_SELECTED';
      else if (curr === 'Shortlisted') notifType = 'APPLICATION_SHORTLISTED';
      else if (curr === 'Rejected') notifType = 'APPLICATION_REJECTED';

      await Notification.create({
        recipient: studentUser._id,
        recipientRole: 'student',
        type: notifType,
        title: `Application Update: ${curr}`,
        message: `Your application for "${jobRole}" at ${companyName} has been updated to "${curr}".${cleanRemarks ? ` Remarks: "${cleanRemarks}"` : ''}`,
        link: `/student/applications?id=${application._id}`,
        relatedId: application._id,
        relatedModel: 'Application',
        eventKey: `INAPP_${eventId}`,
        metadata: {
          outboxId: outboxDoc._id,
          eventId,
          companyName,
          jobRole,
          previousStatus: prev,
          newStatus: curr,
          remarks: cleanRemarks,
        },
      });
    } catch (inAppErr) {
      console.warn('[Notification Outbox] In-app notification creation warning:', inAppErr.message);
    }

    // Trigger asynchronous worker immediately without blocking HTTP response
    setImmediate(() => {
      processNotificationOutbox().catch((err) => {
        console.error('[Notification Worker Immediate Trigger Error]:', err.message);
      });
    });

    console.log(`[Notification Outbox] Enqueued immutable event ${eventId} (${curr}) for student ${studentUser.email}`);

    return {
      success: true,
      outboxId: outboxDoc._id,
      eventId: outboxDoc.eventId,
      emailStatus: outboxDoc.emailStatus,
      recipient: outboxDoc.recipientEmail,
    };
  } catch (err) {
    console.error('[Notification Outbox Error] enqueueStatusUpdateNotification failed:', err.message);
    throw err;
  }
};

/**
 * 2. Asynchronous Queue Worker.
 * Atomically claims pending/retryable items one by one and delivers emails safely.
 */
export const processNotificationOutbox = async () => {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    const now = new Date();

    // Process items in FIFO order
    while (true) {
      // Atomic claim to prevent concurrent workers from claiming the same document
      const item = await NotificationOutbox.findOneAndUpdate(
        {
          emailStatus: { $in: ['pending', 'failed'] },
          attempts: { $lt: 3 },
          nextAttemptAt: { $lte: now },
        },
        {
          $set: {
            emailStatus: 'processing',
            lastAttemptAt: new Date(),
          },
          $inc: { attempts: 1 },
        },
        { sort: { createdAt: 1 }, new: true }
      );

      if (!item) {
        break; // No more eligible queue items at this moment
      }

      console.log(`[Outbox Worker] Processing event ${item.eventId} (${item.newStatus}) for ${item.recipientEmail} (Attempt ${item.attempts}/3)...`);

      try {
        // Send email using IMMUTABLE snapshot from the item itself!
        // We strictly DO NOT fetch application.status to prevent race condition overwrites!
        const info = await emailService.sendApplicationStatusUpdateEmail({
          to: item.recipientEmail,
          name: item.studentName,
          companyName: item.companyName,
          jobRole: item.jobRole,
          newStatus: item.newStatus,
          remarks: item.remarks,
          roundName: item.roundName,
          interviewDetails: item.interviewDetails,
          portalUrl: item.portalUrl,
          officer: item.officer,
          timestamp: item.statusTimestamp,
        });

        // Mark successfully sent
        item.emailStatus = 'sent';
        item.sentAt = new Date();
        item.lastError = null;
        item.messageId = info?.messageId || 'OK';
        await item.save();

        console.log(`[Outbox Worker SUCCESS] Delivered event ${item.eventId} to ${item.recipientEmail}`);
      } catch (sendErr) {
        const errorText = sanitizeError(sendErr);
        console.error(`[Outbox Worker FAIL] Delivery failed for ${item.eventId} (${item.recipientEmail}): ${errorText}`);

        item.emailStatus = 'failed';
        item.lastError = errorText;

        // Controlled exponential backoff: attempt 1 -> 15 seconds, attempt 2 -> 60 seconds
        if (item.attempts < item.maxAttempts) {
          const delaySeconds = item.attempts === 1 ? 15 : 60;
          item.nextAttemptAt = new Date(Date.now() + delaySeconds * 1000);
          console.log(`[Outbox Worker] Scheduled retry for ${item.eventId} in ${delaySeconds}s (Next attempt: ${item.nextAttemptAt.toISOString()})`);
        } else {
          console.warn(`[Outbox Worker] Event ${item.eventId} exhausted ${item.maxAttempts} attempts. Marked as permanently failed.`);
        }

        await item.save();
      }
    }
  } catch (err) {
    console.error('[Outbox Worker Fatal Loop Error]:', err.message);
  } finally {
    isWorkerRunning = false;
  }
};

/**
 * 3. Manual Retry for an authorized Placement Officer
 */
export const retryOutboxNotification = async (outboxId, officerUser) => {
  if (!officerUser || officerUser.role !== 'officer') {
    throw new Error('Only authorized Placement Officers can retry email notifications.');
  }

  const item = await NotificationOutbox.findById(outboxId);
  if (!item) {
    throw new Error('Notification outbox record not found.');
  }

  item.attempts = 0;
  item.emailStatus = 'pending';
  item.nextAttemptAt = new Date();
  item.lastError = null;
  await item.save();

  setImmediate(() => {
    processNotificationOutbox().catch((err) => {
      console.error('[Notification Worker Manual Retry Error]:', err.message);
    });
  });

  return item;
};

/**
 * 4. Get Latest Outbox Delivery Status for an Application
 */
export const getOutboxStatusForApplication = async (applicationId) => {
  const items = await NotificationOutbox.find({ application: applicationId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return items;
};

/**
 * 5. Start Background Worker on Server Boot
 */
export const startNotificationWorker = () => {
  if (workerIntervalId) {
    clearInterval(workerIntervalId);
  }

  // Interrupted recovery: reset any items left in 'processing' on crash/restart to 'pending'
  NotificationOutbox.updateMany(
    { emailStatus: 'processing' },
    { $set: { emailStatus: 'pending', nextAttemptAt: new Date() } }
  ).then((res) => {
    if (res.modifiedCount > 0) {
      console.log(`[Outbox Worker Boot] Recovered ${res.modifiedCount} interrupted email notifications.`);
    }
    // Run initial cycle
    processNotificationOutbox().catch(() => {});
  }).catch((err) => {
    console.warn('[Outbox Worker Boot Warning]:', err.message);
  });

  // Run periodic loop every 20 seconds for retries and persistent queue polling
  workerIntervalId = setInterval(() => {
    processNotificationOutbox().catch((err) => {
      console.error('[Outbox Periodic Worker Error]:', err.message);
    });
  }, 20000);

  console.log('[Outbox Worker] Background notification queue worker initialized (20s cycle).');
};

export default {
  enqueueStatusUpdateNotification,
  processNotificationOutbox,
  retryOutboxNotification,
  getOutboxStatusForApplication,
  startNotificationWorker,
};
