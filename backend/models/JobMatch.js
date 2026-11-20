import mongoose from 'mongoose';

const jobMatchSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true,
      index: true,
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: true,
      index: true,
    },
    resumeAnalysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResumeAnalysis',
    },
    resumeVersion: {
      type: String,
      default: '',
    },
    driveVersion: {
      type: String,
      default: '',
    },
    matchPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    matchingSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    experienceRelevance: {
      type: String,
      enum: ['High', 'Moderate', 'Developing', 'Limited'],
      default: 'Developing',
    },
    scoreBreakdown: {
      technicalSkillsScore: { type: Number, default: 0 }, // 40% weight
      projectsScore: { type: Number, default: 0 },        // 25% weight
      experienceScore: { type: Number, default: 0 },      // 15% weight
      educationScore: { type: Number, default: 0 },       // 10% weight
      certificationsScore: { type: Number, default: 0 },  // 10% weight
      total: { type: Number, default: 0 },
    },
    explanation: {
      type: String,
      default: '',
    },
    preparationSuggestions: {
      type: [String],
      default: [],
    },
    officialEligibility: {
      isEligible: { type: Boolean, default: false },
      reason: { type: String, default: '' },
    },
    hasApplied: {
      type: Boolean,
      default: false,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index prevents duplicate matches for the same student and drive
jobMatchSchema.index({ student: 1, drive: 1 }, { unique: true });
jobMatchSchema.index({ drive: 1, matchPercentage: -1 });

const JobMatch = mongoose.model('JobMatch', jobMatchSchema);
export default JobMatch;
