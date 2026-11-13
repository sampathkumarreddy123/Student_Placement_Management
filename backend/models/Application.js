import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'],
      default: 'Applied',
    },
    currentRound: {
      type: Number,
      default: 1,
    },
    feedback: {
      type: String,
      default: '',
    },
    officerNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate application by the same student for the same drive
applicationSchema.index({ student: 1, drive: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);
export default Application;

