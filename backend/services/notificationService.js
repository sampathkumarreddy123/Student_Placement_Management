import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import PlacementDrive from '../models/PlacementDrive.js';
import emailService from './emailService.js';

/**
 * Modular Email Dispatcher Hook
 * Automatically dispatches branded institutional emails to students for portal events.
 */
export const sendEmailNotification = async (notification, recipientUser) => {
  try {
    if (!recipientUser?.email) return;

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      'http://localhost:5173';
    const actionUrl = notification.link
      ? `${frontendUrl}${notification.link}`
      : `${frontendUrl}/student/dashboard`;

    switch (notification.type) {
      case 'APPLICATION_SUBMITTED':
        await emailService.sendApplicationSubmittedEmail({
          to: recipientUser.email,
          name: recipientUser.name,
          companyName: notification.metadata?.companyName || 'Company',
          jobRole: notification.metadata?.jobRole || 'Recruitment Drive',
          packageLPA: notification.metadata?.packageLPA,
          portalUrl: actionUrl,
        });
        break;

      case 'APPLICATION_SELECTED':
        await emailService.sendSelectionOfferEmail({
          to: recipientUser.email,
          name: recipientUser.name,
          companyName: notification.metadata?.companyName || 'Company',
          jobRole: notification.metadata?.jobRole || 'Position',
          packageLPA: notification.metadata?.packageLPA,
          remarks: notification.metadata?.remarks,
          portalUrl: actionUrl,
        });
        break;

      case 'APPLICATION_SHORTLISTED':
      case 'APPLICATION_REJECTED':
      case 'APPLICATION_STATUS_CHANGED':
        await emailService.sendApplicationStatusUpdateEmail({
          to: recipientUser.email,
          name: recipientUser.name,
          companyName: notification.metadata?.companyName || 'Company',
          jobRole: notification.metadata?.jobRole || 'Position',
          newStatus: notification.metadata?.newStatus || notification.title,
          remarks: notification.metadata?.remarks,
          portalUrl: actionUrl,
        });
        break;

      case 'DRIVE_PUBLISHED':
        await emailService.sendDriveAnnouncementEmail({
          to: recipientUser.email,
          name: recipientUser.name,
          companyName: notification.metadata?.companyName || 'Company',
          jobRole: notification.metadata?.jobRole || 'Position',
          packageLPA: notification.metadata?.packageLPA,
          deadline: notification.metadata?.deadline,
          portalUrl: actionUrl,
        });
        break;

      default:
        await emailService.sendGenericNotificationEmail({
          to: recipientUser.email,
          name: recipientUser.name,
          title: notification.title,
          message: notification.message,
          portalUrl: actionUrl,
        });
        break;
    }
  } catch (err) {
    console.error('[Notification Email Dispatch Error]:', err.message);
  }
};

/**
 * Create a single notification with duplicate prevention
 */
export const createNotification = async ({
  recipient,
  recipientRole,
  type,
  title,
  message,
  link = '',
  relatedId = null,
  relatedModel = null,
  eventKey = null,
  metadata = {},
}) => {
  try {
    if (!recipient) return null;

    // Prevent duplicate notification for identical eventKey
    if (eventKey) {
      const existing = await Notification.findOne({ eventKey });
      if (existing) {
        return existing;
      }
    }

    const notification = await Notification.create({
      recipient,
      recipientRole,
      type,
      title,
      message,
      link,
      relatedId,
      relatedModel,
      eventKey,
      metadata,
    });

    // Optionally trigger modular email dispatcher in background
    User.findById(recipient)
      .select('name email')
      .then((user) => {
        if (user) {
          sendEmailNotification(notification, user);
        }
      })
      .catch(() => {});

    return notification;
  } catch (error) {
    console.error('[Notification Service Error] Failed to create notification:', error.message);
    return null;
  }
};

/**
 * 1. Notify Students when a new placement drive is published
 */
export const notifyStudentsOnDrivePublished = async (drive) => {
  try {
    if (!drive) return;

    let companyName = drive.company?.name;
    if (!companyName && drive.company) {
      const comp = await Company.findById(drive.company).select('name');
      companyName = comp?.name || 'Company';
    } else if (!companyName) {
      companyName = 'Company';
    }

    const packageText = drive.packageLPA ? ` offering ₹${drive.packageLPA} LPA` : '';
    const closingDate = drive.applicationClosingDate || drive.registrationDeadline;
    const deadlineText = closingDate
      ? ` Deadline: ${new Date(closingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`
      : '';

    // Find all registered students
    const students = await User.find({ role: 'student' }).select('_id name email');

    const notifications = students.map((student) => ({
      recipient: student._id,
      recipientRole: 'student',
      type: 'DRIVE_PUBLISHED',
      title: `New Placement Drive: ${companyName}`,
      message: `${companyName} published a new campus drive for "${drive.jobRole}"${packageText}.${deadlineText}`,
      link: `/drives/${drive._id}`,
      relatedId: drive._id,
      relatedModel: 'PlacementDrive',
      eventKey: `DRIVE_PUB_${drive._id}_${student._id}`,
      metadata: {
        driveId: drive._id,
        companyName,
        jobRole: drive.jobRole,
        packageLPA: drive.packageLPA,
      },
    }));

    // Insert without throwing on duplicate keys
    for (const notifData of notifications) {
      await createNotification(notifData);
    }
  } catch (err) {
    console.error('[Notification Service Error] notifyStudentsOnDrivePublished:', err.message);
  }
};

/**
 * 2. Notify Student and Placement Officers when an application is submitted
 */
export const notifyOnApplicationSubmitted = async (application, studentUser, drive, company) => {
  try {
    if (!application || !studentUser) return;

    const companyName = company?.name || drive?.company?.name || 'Company';
    const jobRole = drive?.jobRole || 'Recruitment Drive';

    // 2a. Student Notification
    await createNotification({
      recipient: studentUser._id,
      recipientRole: 'student',
      type: 'APPLICATION_SUBMITTED',
      title: 'Application Submitted Successfully',
      message: `Your application for "${jobRole}" at ${companyName} was submitted successfully and is now under review.`,
      link: '/student/applications',
      relatedId: application._id,
      relatedModel: 'Application',
      eventKey: `APP_SUBMIT_STU_${application._id}`,
      metadata: {
        applicationId: application._id,
        driveId: drive?._id,
        companyName,
        jobRole,
      },
    });

    // 2b. Placement Officer Notifications
    const officers = await User.find({ role: 'officer' }).select('_id name email');
    for (const officer of officers) {
      await createNotification({
        recipient: officer._id,
        recipientRole: 'officer',
        type: 'APPLICATION_SUBMITTED',
        title: `New Applicant: ${studentUser.name}`,
        message: `${studentUser.name} has submitted an application for "${jobRole}" at ${companyName}.`,
        link: `/officer/applications?driveId=${drive?._id || ''}`,
        relatedId: application._id,
        relatedModel: 'Application',
        eventKey: `APP_SUBMIT_OFF_${application._id}_${officer._id}`,
        metadata: {
          applicationId: application._id,
          studentName: studentUser.name,
          driveId: drive?._id,
          companyName,
          jobRole,
        },
      });
    }
  } catch (err) {
    console.error('[Notification Service Error] notifyOnApplicationSubmitted:', err.message);
  }
};

/**
 * 3. Notify Student when their application status changes
 * (Shortlisted, Selected, Rejected, or general update)
 */
export const notifyOnApplicationStatusChange = async (
  application,
  previousStatus,
  newStatus,
  remarks = ''
) => {
  try {
    if (!application || !newStatus) return;

    // Populate company and drive info if missing
    let companyName = application.company?.name || application.drive?.company?.name;
    let jobRole = application.drive?.jobRole;

    if (!companyName && application.company) {
      const comp = await Company.findById(application.company).select('name');
      companyName = comp?.name;
    }
    if (!jobRole && application.drive) {
      const d = await PlacementDrive.findById(application.drive).select('jobRole');
      jobRole = d?.jobRole;
    }
    companyName = companyName || 'Company';
    jobRole = jobRole || 'Position';

    const studentId = application.student?._id || application.student;

    let type = 'APPLICATION_STATUS_CHANGED';
    let title = `Application Status: ${newStatus}`;
    let message = `Your application for "${jobRole}" at ${companyName} has been updated to "${newStatus}".`;

    if (newStatus === 'Selected') {
      type = 'APPLICATION_SELECTED';
      title = `🎉 Congratulations! Selected at ${companyName}`;
      message = `Congratulations! You have been officially selected for the "${jobRole}" role at ${companyName}!${remarks ? ` Officer remarks: "${remarks}"` : ''}`;
    } else if (newStatus === 'Shortlisted') {
      type = 'APPLICATION_SHORTLISTED';
      title = `Application Shortlisted: ${companyName}`;
      const roundText = application.currentRound ? ` for Round ${application.currentRound}` : '';
      message = `You have been shortlisted${roundText} for "${jobRole}" at ${companyName}.${remarks ? ` Details: "${remarks}"` : ''}`;
    } else if (newStatus === 'Rejected') {
      type = 'APPLICATION_REJECTED';
      title = `Application Update: ${companyName}`;
      message = `Your application for "${jobRole}" at ${companyName} was not shortlisted for the next stage.${remarks ? ` Feedback: "${remarks}"` : ''}`;
    } else if (remarks) {
      message += ` Remarks: "${remarks}"`;
    }

    const historyIndex = application.statusHistory?.length || 1;
    const eventKey = `APP_STATUS_${application._id}_${newStatus}_${historyIndex}`;

    await createNotification({
      recipient: studentId,
      recipientRole: 'student',
      type,
      title,
      message,
      link: '/student/applications',
      relatedId: application._id,
      relatedModel: 'Application',
      eventKey,
      metadata: {
        applicationId: application._id,
        previousStatus,
        newStatus,
        companyName,
        jobRole,
        remarks,
      },
    });
  } catch (err) {
    console.error('[Notification Service Error] notifyOnApplicationStatusChange:', err.message);
  }
};

