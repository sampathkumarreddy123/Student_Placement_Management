import mongoose from 'mongoose';
import RecruitmentRound from '../models/RecruitmentRound.js';
import PlacementDrive from '../models/PlacementDrive.js';
import Application from '../models/Application.js';
import User from '../models/User.js';
import {
  notifyOnApplicationStatusChange,
  createNotification,
  notifyStudentsOnRoundAnnounced,
  notifyStudentsOnRoundUpdated,
} from '../services/notificationService.js';
import emailService from '../services/emailService.js';

/**
 * 1. Get all recruitment rounds for a placement drive with candidate statistics
 * GET /api/rounds/drive/:driveId
 */
export const getRoundsByDrive = async (req, res, next) => {
  try {
    const { driveId } = req.params;

    const drive = await PlacementDrive.findById(driveId).populate('company', 'name logoUrl');
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found.',
      });
    }

    const rounds = await RecruitmentRound.find({ drive: driveId }).sort({ roundNumber: 1 });

    // Fetch all drive applications to calculate round-wise candidate statistics
    const applications = await Application.find({ drive: driveId })
      .select('status currentRound roundResults student')
      .lean();

    const roundsWithStats = rounds.map((round) => {
      const roundObj = round.toObject();

      // Find candidates who have reached or participated in this round
      const candidateResults = applications
        .map((app) => {
          const result = app.roundResults?.find(
            (r) =>
              String(r.round) === String(round._id) ||
              r.roundNumber === round.roundNumber
          );
          if (result) {
            return result.status;
          }
          // If candidate is currently in or beyond this round but has no explicit roundResult recorded
          if (app.currentRound >= round.roundNumber) {
            return 'Pending';
          }
          return null;
        })
        .filter(Boolean);

      const totalCandidates = candidateResults.length;
      const passedCount = candidateResults.filter((s) => s === 'Passed').length;
      const failedCount = candidateResults.filter((s) => s === 'Failed').length;
      const pendingCount = candidateResults.filter((s) => s === 'Pending').length;
      const absentCount = candidateResults.filter((s) => s === 'Absent').length;

      const evaluatedCount = passedCount + failedCount;
      const passRate = evaluatedCount > 0 ? Math.round((passedCount / evaluatedCount) * 100) : 0;

      return {
        ...roundObj,
        stats: {
          totalCandidates,
          passedCount,
          failedCount,
          pendingCount,
          absentCount,
          passRate,
        },
      };
    });

    res.status(200).json({
      success: true,
      drive: {
        _id: drive._id,
        title: drive.title,
        jobRole: drive.jobRole,
        company: drive.company,
        status: drive.status,
      },
      count: roundsWithStats.length,
      rounds: roundsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Create a new recruitment round for a placement drive
 * POST /api/rounds/drive/:driveId
 */
export const createRound = async (req, res, next) => {
  try {
    const { driveId } = req.params;
    const { name, description, date, mode, venue, isFinalRound, roundNumber } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Round name is required (e.g. Online Assessment, Technical Interview).',
      });
    }

    const drive = await PlacementDrive.findById(driveId);
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found.',
      });
    }

    // Determine sequence number if not provided
    let sequence = roundNumber ? Number(roundNumber) : null;
    if (!sequence) {
      const highestRound = await RecruitmentRound.findOne({ drive: driveId })
        .sort({ roundNumber: -1 })
        .select('roundNumber');
      sequence = highestRound ? highestRound.roundNumber + 1 : 1;
    } else {
      // Check for duplicate sequence
      const existing = await RecruitmentRound.findOne({ drive: driveId, roundNumber: sequence });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Round number ${sequence} already exists for this drive. Please choose a different sequence or edit the existing round.`,
        });
      }
    }

    // If marked as final round, clear isFinalRound on other rounds for this drive
    if (isFinalRound) {
      await RecruitmentRound.updateMany(
        { drive: driveId },
        { $set: { isFinalRound: false } }
      );
    }

    const round = await RecruitmentRound.create({
      drive: driveId,
      roundNumber: sequence,
      name: name.trim(),
      description: description ? description.trim() : '',
      date: date ? new Date(date) : undefined,
      mode: mode || 'Online',
      venue: venue ? venue.trim() : '',
      isFinalRound: Boolean(isFinalRound),
      status: 'Scheduled',
      createdBy: req.user._id,
    });

    // Synchronize PlacementDrive.rounds embedded array
    drive.rounds.push({
      roundNumber: round.roundNumber,
      roundName: round.name,
      description: round.description,
      date: round.date,
    });
    await drive.save({ validateBeforeSave: false });

    // Synchronize round into applications for this drive and notify all applicants
    try {
      const driveApplications = await Application.find({ drive: driveId });
      for (const app of driveApplications) {
        const hasRound = app.roundResults?.some(
          (r) => String(r.round) === String(round._id) || r.roundNumber === round.roundNumber
        );
        if (!hasRound) {
          app.roundResults = app.roundResults || [];
          app.roundResults.push({
            round: round._id,
            roundNumber: round.roundNumber,
            roundName: round.name,
            status: 'Pending',
            remarks: round.description || '',
            evaluatedAt: new Date(),
          });
        }

        // Advance qualified students who cleared the previous round to this newly created round
        if (round.roundNumber > 1 && app.status !== 'Rejected') {
          const clearedPrevious = app.roundResults?.some(
            (r) => r.roundNumber === round.roundNumber - 1 && r.status === 'Passed'
          );
          if (clearedPrevious) {
            app.currentRound = round.roundNumber;
            if (app.status !== 'Selected') {
              app.status = 'Shortlisted';
            }
          }
        }

        await app.save();
      }

      notifyStudentsOnRoundAnnounced(drive, round).catch((err) =>
        console.error('Failed to dispatch round announcement notification:', err.message)
      );
    } catch (syncErr) {
      console.warn('Applicant round sync warning:', syncErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Recruitment Round ${round.roundNumber} ("${round.name}") created successfully.`,
      round,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Update recruitment round details
 * PUT /api/rounds/:roundId
 */
export const updateRound = async (req, res, next) => {
  try {
    const { roundId } = req.params;
    const { name, description, date, mode, venue, isFinalRound, status } = req.body;

    const round = await RecruitmentRound.findById(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Recruitment round not found.',
      });
    }

    if (name && name.trim()) round.name = name.trim();
    if (description !== undefined) round.description = description.trim();
    if (date !== undefined) round.date = date ? new Date(date) : null;
    if (mode) round.mode = mode;
    if (venue !== undefined) round.venue = venue.trim();
    if (status) round.status = status;

    if (isFinalRound !== undefined) {
      if (isFinalRound) {
        await RecruitmentRound.updateMany(
          { drive: round.drive, _id: { $ne: round._id } },
          { $set: { isFinalRound: false } }
        );
      }
      round.isFinalRound = Boolean(isFinalRound);
    }

    await round.save();

    // Sync into PlacementDrive.rounds
    const drive = await PlacementDrive.findById(round.drive);
    if (drive) {
      const idx = drive.rounds.findIndex((r) => r.roundNumber === round.roundNumber);
      if (idx !== -1) {
        drive.rounds[idx].roundName = round.name;
        drive.rounds[idx].description = round.description;
        drive.rounds[idx].date = round.date;
      }
      await drive.save({ validateBeforeSave: false });

      // Sync into applications and notify applicants of the update
      try {
        await Application.updateMany(
          { drive: round.drive, 'roundResults.roundNumber': round.roundNumber },
          {
            $set: {
              'roundResults.$.roundName': round.name,
              'roundResults.$.remarks': round.description || '',
            },
          }
        );
        notifyStudentsOnRoundUpdated(drive, round).catch((err) =>
          console.error('Failed to dispatch round update notification:', err.message)
        );
      } catch (syncErr) {
        console.warn('Applicant round update sync warning:', syncErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Recruitment Round ${round.roundNumber} updated successfully.`,
      round,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Delete a recruitment round
 * DELETE /api/rounds/:roundId
 */
export const deleteRound = async (req, res, next) => {
  try {
    const { roundId } = req.params;

    const round = await RecruitmentRound.findById(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Recruitment round not found.',
      });
    }

    const driveId = round.drive;
    const deletedRoundNum = round.roundNumber;

    await RecruitmentRound.findByIdAndDelete(roundId);

    // Sync into PlacementDrive
    await PlacementDrive.findByIdAndUpdate(driveId, {
      $pull: { rounds: { roundNumber: deletedRoundNum } },
    });

    res.status(200).json({
      success: true,
      message: `Round ${deletedRoundNum} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Get candidates for a specific recruitment round
 * GET /api/rounds/:roundId/candidates
 */
export const getRoundCandidates = async (req, res, next) => {
  try {
    const { roundId } = req.params;

    const round = await RecruitmentRound.findById(roundId).populate({
      path: 'drive',
      select: 'title jobRole company',
      populate: { path: 'company', select: 'name logoUrl' },
    });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Recruitment round not found.',
      });
    }

    // Candidates are applications for this drive that have reached at least this round,
    // or who have a recorded roundResult for this round
    const applications = await Application.find({ drive: round.drive._id })
      .populate('student', 'name email')
      .populate('studentProfile')
      .sort({ appliedAt: -1 });

    const candidates = [];

    for (const app of applications) {
      const existingResult = app.roundResults?.find(
        (r) =>
          String(r.round) === String(round._id) ||
          r.roundNumber === round.roundNumber
      );

      // Check if candidate reached this round
      const hasReachedRound = app.currentRound >= round.roundNumber;
      const isFailedInPriorRound =
        app.status === 'Rejected' && app.currentRound < round.roundNumber;

      if (existingResult || (hasReachedRound && !isFailedInPriorRound)) {
        candidates.push({
          applicationId: app._id,
          student: {
            _id: app.student?._id,
            name: app.student?.name || 'Student',
            email: app.student?.email || '',
            rollNumber:
              app.studentProfile?.rollNumber ||
              app.resumeSnapshot?.studentRollNumber ||
              'N/A',
            department:
              app.studentProfile?.department ||
              app.resumeSnapshot?.studentDepartment ||
              'N/A',
            cgpa:
              app.studentProfile?.cgpa !== undefined
                ? app.studentProfile.cgpa
                : app.resumeSnapshot?.studentCgpa || 0,
            phone: app.studentProfile?.phone || '',
            resumeUrl:
              app.studentProfile?.resumeUrl ||
              app.resumeSnapshot?.resumeUrl ||
              '',
          },
          currentApplicationStatus: app.status,
          currentRound: app.currentRound,
          roundStatus: existingResult?.status || 'Pending',
          remarks: existingResult?.remarks || '',
          evaluatedAt: existingResult?.evaluatedAt || null,
          evaluatedBy: existingResult?.evaluatedBy || null,
        });
      }
    }

    res.status(200).json({
      success: true,
      round: {
        _id: round._id,
        roundNumber: round.roundNumber,
        name: round.name,
        description: round.description,
        date: round.date,
        mode: round.mode,
        venue: round.venue,
        isFinalRound: round.isFinalRound,
        status: round.status,
        drive: round.drive,
      },
      candidatesCount: candidates.length,
      candidates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Evaluate a single student in a recruitment round (Pass, Fail, Pending, Absent)
 * PUT /api/rounds/:roundId/candidate/:applicationId/evaluate
 */
export const evaluateCandidate = async (req, res, next) => {
  try {
    const { roundId, applicationId } = req.params;
    const { status, remarks = '' } = req.body;

    const validStatuses = ['Pending', 'Passed', 'Failed', 'Absent'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid evaluation status. Allowed values: ${validStatuses.join(', ')}`,
      });
    }

    const round = await RecruitmentRound.findById(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Recruitment round not found.',
      });
    }

    const application = await Application.findById(applicationId)
      .populate('student', 'name email')
      .populate({
        path: 'drive',
        select: 'title jobRole packageLPA company',
        populate: { path: 'company', select: 'name' },
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Student application not found.',
      });
    }

    // Prevent invalid transitions: Candidate cannot be evaluated in Round N if they failed a previous round
    if (round.roundNumber > 1) {
      const priorFailed = application.roundResults?.some(
        (r) => r.roundNumber < round.roundNumber && (r.status === 'Failed' || r.status === 'Absent')
      );
      if (priorFailed && status === 'Passed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot mark student as Passed: The candidate did not clear an earlier recruitment round.',
        });
      }
    }

    // 1. Update or append roundResults in Application
    if (!application.roundResults) {
      application.roundResults = [];
    }

    const existingResultIndex = application.roundResults.findIndex(
      (r) =>
        String(r.round) === String(round._id) ||
        r.roundNumber === round.roundNumber
    );

    const resultData = {
      round: round._id,
      roundNumber: round.roundNumber,
      roundName: round.name,
      status,
      remarks: remarks.trim(),
      evaluatedBy: req.user._id,
      evaluatedAt: new Date(),
    };

    if (existingResultIndex !== -1) {
      application.roundResults[existingResultIndex] = {
        ...application.roundResults[existingResultIndex].toObject(),
        ...resultData,
      };
    } else {
      application.roundResults.push(resultData);
    }

    // 2. Synchronize Application overarching status
    const previousAppStatus = application.status;
    let newAppStatus = previousAppStatus;

    if (status === 'Failed' || status === 'Absent') {
      newAppStatus = 'Rejected';
      application.officerNotes = `Did not clear Round ${round.roundNumber} (${round.name}). ${remarks ? `Remarks: ${remarks}` : ''}`;
    } else if (status === 'Passed') {
      if (round.isFinalRound) {
        newAppStatus = 'Selected';
        application.selectionRemarks = remarks || `Cleared final round: ${round.name}. Offered placement.`;
      } else {
        newAppStatus = 'Shortlisted';
        const nextRound = await RecruitmentRound.findOne({
          drive: round.drive,
          roundNumber: round.roundNumber + 1,
        });
        if (nextRound) {
          application.currentRound = nextRound.roundNumber;
          application.officerNotes = `Cleared Round ${round.roundNumber} (${round.name}). Qualified for Round ${nextRound.roundNumber} (${nextRound.name}).`;
        } else {
          application.officerNotes = `Cleared Round ${round.roundNumber} (${round.name}). Qualified for next round.`;
        }
      }
    } else if (status === 'Pending') {
      if (application.status === 'Rejected' || application.status === 'Selected') {
        newAppStatus = 'Interviewing';
      }
    }

    application.status = newAppStatus;

    // Record in statusHistory if status changed
    if (previousAppStatus !== newAppStatus) {
      application.statusHistory.push({
        previousStatus: previousAppStatus,
        newStatus: newAppStatus,
        updatedBy: req.user._id,
        updatedDate: new Date(),
        remarks: `Round ${round.roundNumber} (${round.name}) evaluated as ${status}.${remarks ? ` Feedback: "${remarks}"` : ''}`,
      });
    }

    await application.save();

    // 3. Dispatch automated notifications to student
    const studentUser = application.student;

    if (studentUser) {
      try {
        await Promise.race([
          notifyOnApplicationStatusChange(
            application,
            previousAppStatus,
            newAppStatus,
            remarks || `Result for Round ${round.roundNumber} (${round.name}): ${status}`,
            req.user
          ),
          new Promise((resolve) => setTimeout(resolve, 3500)),
        ]);
      } catch (err) {
        console.error('[Notification Error] Round evaluation dispatch:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Candidate evaluated as "${status}" for Round ${round.roundNumber} (${round.name}).`,
      applicationStatus: application.status,
      roundResult: resultData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Move all qualified (Passed) students to the next round
 * POST /api/rounds/:roundId/move-qualified
 */
export const moveQualifiedToNextRound = async (req, res, next) => {
  try {
    const { roundId } = req.params;

    const currentRound = await RecruitmentRound.findById(roundId);
    if (!currentRound) {
      return res.status(404).json({
        success: false,
        message: 'Current recruitment round not found.',
      });
    }

    if (currentRound.isFinalRound) {
      return res.status(400).json({
        success: false,
        message: 'This is the final recruitment round. Qualified candidates are marked as Selected.',
      });
    }

    // Find the next round in sequence
    const nextRound = await RecruitmentRound.findOne({
      drive: currentRound.drive,
      roundNumber: currentRound.roundNumber + 1,
    });

    if (!nextRound) {
      return res.status(400).json({
        success: false,
        message: `Round ${currentRound.roundNumber + 1} does not exist yet. Please create Round ${currentRound.roundNumber + 1} before moving qualified students.`,
      });
    }

    // Find all applications that passed the current round and are not yet in the next round
    const applications = await Application.find({
      drive: currentRound.drive,
      currentRound: currentRound.roundNumber,
      status: { $ne: 'Rejected' },
      roundResults: {
        $elemMatch: {
          roundNumber: currentRound.roundNumber,
          status: 'Passed',
        },
      },
    }).populate('student', 'name email');

    let movedCount = 0;

    for (const app of applications) {
      app.currentRound = nextRound.roundNumber;
      app.status = 'Interviewing';

      // Ensure next round entry exists with Pending status
      const hasNextResult = app.roundResults?.some((r) => r.roundNumber === nextRound.roundNumber);
      if (!hasNextResult) {
        if (!app.roundResults) app.roundResults = [];
        app.roundResults.push({
          round: nextRound._id,
          roundNumber: nextRound.roundNumber,
          roundName: nextRound.name,
          status: 'Pending',
          remarks: `Qualified from Round ${currentRound.roundNumber} (${currentRound.name})`,
          evaluatedAt: new Date(),
        });
      }

      app.statusHistory.push({
        previousStatus: 'Shortlisted',
        newStatus: 'Interviewing',
        updatedBy: req.user._id,
        updatedDate: new Date(),
        remarks: `Advanced to Round ${nextRound.roundNumber}: ${nextRound.name}.`,
      });

      await app.save();
      movedCount++;

      // Notify student
      if (app.student) {
        createNotification({
          recipient: app.student._id,
          recipientRole: 'student',
          type: 'APPLICATION_SHORTLISTED',
          title: `Advanced to Round ${nextRound.roundNumber}: ${nextRound.name}`,
          message: `Congratulations! You have qualified for Round ${nextRound.roundNumber} (${nextRound.name}). Date: ${nextRound.date ? new Date(nextRound.date).toLocaleDateString() : 'TBA'}.`,
          link: `/student/applications?id=${app._id}`,
          relatedId: app._id,
          relatedModel: 'Application',
          eventKey: `ADVANCE_ROUND_${nextRound._id}_${app._id}`,
          recipientUser: app.student,
        }).catch(() => {});
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully advanced ${movedCount} qualified candidate(s) to Round ${nextRound.roundNumber} (${nextRound.name}).`,
      movedCount,
      nextRound: {
        _id: nextRound._id,
        roundNumber: nextRound.roundNumber,
        name: nextRound.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Student view for drive recruitment rounds & progress
 * GET /api/rounds/drive/:driveId/student-view
 */
export const getStudentDriveRounds = async (req, res, next) => {
  try {
    const { driveId } = req.params;
    const studentUserId = req.user._id;

    const drive = await PlacementDrive.findById(driveId)
      .populate('company', 'name logoUrl industry')
      .select('title jobRole packageLPA company status applicationClosingDate');

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found.',
      });
    }

    const rounds = await RecruitmentRound.find({ drive: driveId })
      .sort({ roundNumber: 1 })
      .select('roundNumber name description date mode venue isFinalRound status');

    const application = await Application.findOne({
      drive: driveId,
      student: studentUserId,
    }).select('status currentRound roundResults appliedAt selectionRemarks officerNotes');

    const roundsProgress = rounds.map((round) => {
      const studentResult = application?.roundResults?.find(
        (r) =>
          String(r.round) === String(round._id) ||
          r.roundNumber === round.roundNumber
      );

      let stepStatus = 'Upcoming';
      if (application) {
        if (studentResult) {
          stepStatus = studentResult.status; // Passed, Failed, Pending, Absent
        } else if (application.currentRound === round.roundNumber) {
          stepStatus = application.status === 'Rejected' ? 'Failed' : 'In Progress';
        } else if (application.currentRound > round.roundNumber) {
          stepStatus = 'Passed';
        } else {
          stepStatus = 'Upcoming';
        }
      }

      return {
        _id: round._id,
        roundNumber: round.roundNumber,
        name: round.name,
        description: round.description,
        date: round.date,
        mode: round.mode,
        venue: round.venue,
        isFinalRound: round.isFinalRound,
        studentStatus: stepStatus,
        remarks: studentResult?.remarks || '',
      };
    });

    res.status(200).json({
      success: true,
      drive,
      isApplied: Boolean(application),
      applicationStatus: application?.status || null,
      currentRound: application?.currentRound || 1,
      selectionRemarks: application?.selectionRemarks || '',
      officerNotes: application?.officerNotes || '',
      rounds: roundsProgress,
    });
  } catch (error) {
    next(error);
  }
};
