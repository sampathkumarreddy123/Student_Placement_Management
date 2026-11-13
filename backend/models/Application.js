import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: true,
    },
    studentProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    resumeSnapshot: {
      resumeUrl: {
        type: String,
        default: '',
      },
      resumeOriginalName: {
        type: String,
        default: '',
      },
      resumeSize: {
        type: Number,
        default: 0,
      },
      studentCgpa: {
        type: Number,
      },
      studentDepartment: {
        type: String,
        default: '',
      },
      studentRollNumber: {
        type: String,
        default: '',
      },
      skills: [{
        type: String,
      }],
    },
    status: {
      type: String,
      enum: ['Applied', 'Under Review', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'],
      default: 'Applied',
    },
    currentRound: {
      type: Number,
      default: 1,
    },
    selectionRemarks: {
      type: String,
      default: '',
    },
    feedback: {
      type: String,
      default: '',
    },
    officerNotes: {
      type: String,
      default: '',
    },
    statusHistory: [
      {
        previousStatus: {
          type: String,
          required: true,
        },
        newStatus: {
          type: String,
          required: true,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        updatedDate: {
          type: Date,
          default: Date.now,
        },
        remarks: {
          type: String,
          default: '',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate application by the same student for the same drive
applicationSchema.index({ student: 1, drive: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);
export default Application;


