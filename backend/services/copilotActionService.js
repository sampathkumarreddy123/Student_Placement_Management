import mongoose from 'mongoose';
import Application from '../models/Application.js';
import Notification from '../models/Notification.js';
import StudentProfile from '../models/StudentProfile.js';
import PlacementDrive from '../models/PlacementDrive.js';
import User from '../models/User.js';
import { sendEmailNotification } from './notificationService.js';

/**
 * Executes approved administrative actions requiring explicit officer consent.
 * Strictly verifies officer permissions and input validation.
 */
export const executeAdminAction = async ({ actionType, payload, officerUser }) => {
  if (!officerUser || officerUser.role !== 'officer') {
    throw new Error('Unauthorized: Only verified Placement Officers may execute administrative actions.');
  }

  if (!actionType || !payload) {
    throw new Error('Invalid action execution parameters.');
  }

  switch (actionType) {
    case 'PUBLISH_ANNOUNCEMENT': {
      const { driveId, announcementTitle, message, targetAudience } = payload;

      let recipients = [];

      if (driveId && mongoose.isValidObjectId(driveId)) {
        // Broadcast to students who applied to this drive
        const apps = await Application.find({ drive: driveId }).select('student');
        recipients = apps.map((a) => a.student);

        // If no applicants yet, broadcast to all active students
        if (recipients.length === 0) {
          const students = await User.find({ role: 'student', isActive: true }).select('_id');
          recipients = students.map((s) => s._id);
        }
      } else {
        const students = await User.find({ role: 'student', isActive: true }).select('_id');
        recipients = students.map((s) => s._id);
      }

      if (recipients.length === 0) {
        return {
          success: true,
          message: 'Announcement recorded, but no active student recipients were identified.',
          notifiedCount: 0,
        };
      }

      const notificationsToInsert = recipients.map((studentId) => ({
        recipient: studentId,
        recipientRole: 'student',
        type: 'SYSTEM',
        title: announcementTitle || 'Important Placement Announcement',
        message: message || 'Please check the placement portal for updates.',
        link: driveId ? `/drives/${driveId}` : '/student/dashboard',
        relatedId: driveId && mongoose.isValidObjectId(driveId) ? driveId : null,
        relatedModel: driveId ? 'PlacementDrive' : null,
      }));

      await Notification.insertMany(notificationsToInsert);

      return {
        success: true,
        message: `Successfully broadcasted announcement to ${recipients.length} student(s).`,
        notifiedCount: recipients.length,
        title: announcementTitle,
      };
    }

    case 'UPDATE_APPLICATION_STATUS_BATCH': {
      const { applicationIds, targetStatus, remarks = 'Updated via Copilot shortlisting review' } = payload;

      if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
        throw new Error('No application IDs provided for batch status update.');
      }

      const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'];
      if (!validStatuses.includes(targetStatus)) {
        throw new Error(`Invalid target status '${targetStatus}'. Must be one of: ${validStatuses.join(', ')}`);
      }

      const updateResult = await Application.updateMany(
        { _id: { $in: applicationIds } },
        {
          $set: { status: targetStatus },
          $push: {
            statusHistory: {
              status: targetStatus,
              changedBy: officerUser._id,
              changedByRole: 'officer',
              changedAt: new Date(),
              remarks,
            },
          },
        }
      );

      // Create notification for updated students
      const updatedApplications = await Application.find({ _id: { $in: applicationIds } })
        .populate('student', 'name email')
        .populate('company', 'name')
        .populate('drive', 'title jobRole');

      for (const app of updatedApplications) {
        if (app.student) {
          const notif = await Notification.create({
            recipient: app.student._id,
            recipientRole: 'student',
            type: targetStatus === 'Shortlisted' ? 'APPLICATION_SHORTLISTED' : 'APPLICATION_STATUS_CHANGED',
            title: `Application Status: ${targetStatus}`,
            message: `Your application for ${app.drive?.jobRole || 'role'} at ${app.company?.name || 'company'} has been updated to ${targetStatus}.`,
            link: '/student/applications',
            relatedId: app._id,
            relatedModel: 'Application',
          });

          // Attempt async email dispatch
          sendEmailNotification(notif, app.student).catch((err) =>
            console.warn('[CopilotAction] Email dispatch skipped:', err.message)
          );
        }
      }

      return {
        success: true,
        message: `Successfully updated ${updateResult.modifiedCount} student application(s) to status '${targetStatus}'.`,
        updatedCount: updateResult.modifiedCount,
        targetStatus,
      };
    }

    default:
      throw new Error(`Unsupported action type '${actionType}'.`);
  }
};
