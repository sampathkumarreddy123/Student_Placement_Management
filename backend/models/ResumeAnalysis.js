import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema(
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
    resumeUrl: {
      type: String,
      required: true,
    },
    resumeOriginalName: {
      type: String,
      default: 'Resume.pdf',
    },
    resumeFormat: {
      type: String,
      enum: ['pdf', 'docx', 'doc', 'other'],
      default: 'pdf',
    },
    resumeSize: {
      type: Number,
      default: 0,
    },
    resumeUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    resumeVersion: {
      type: String,
      index: true,
    },
    rawTextLength: {
      type: Number,
      default: 0,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    extractedSkills: {
      technical: { type: [String], default: [] },
      languages: { type: [String], default: [] },
      frameworks: { type: [String], default: [] },
      databases: { type: [String], default: [] },
      toolsAndCloud: { type: [String], default: [] },
      softSkills: { type: [String], default: [] },
      all: { type: [String], default: [] },
    },
    education: [
      {
        degree: { type: String, default: '' },
        institution: { type: String, default: '' },
        score: { type: String, default: '' },
        period: { type: String, default: '' },
      },
    ],
    projects: [
      {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        technologies: { type: [String], default: [] },
        improvements: { type: String, default: '' },
      },
    ],
    experience: [
      {
        role: { type: String, default: '' },
        organization: { type: String, default: '' },
        duration: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],
    certifications: {
      type: [String],
      default: [],
    },
    achievements: {
      type: [String],
      default: [],
    },
    sectionAnalysis: {
      contactInfo: {
        score: { type: Number, default: 0 },
        status: { type: String, default: 'Needs Review' },
        feedback: { type: String, default: '' },
        present: { type: Boolean, default: false },
      },
      summary: {
        score: { type: Number, default: 0 },
        status: { type: String, default: 'Needs Review' },
        feedback: { type: String, default: '' },
        suggestedSummary: { type: String, default: '' },
      },
      education: {
        score: { type: Number, default: 0 },
        status: { type: String, default: 'Needs Review' },
        feedback: { type: String, default: '' },
      },
      technicalSkills: {
        score: { type: Number, default: 0 },
        status: { type: String, default: 'Needs Review' },
        feedback: { type: String, default: '' },
      },
      projects: {
        score: { type: Number, default: 0 },
        status: { type: String, default: 'Needs Review' },
        feedback: { type: String, default: '' },
      },
      experience: {
        score: { type: Number, default: 0 },
        status: { type: String, default: 'Needs Review' },
        feedback: { type: String, default: '' },
      },
      certifications: {
        score: { type: Number, default: 0 },
        status: { type: String, default: 'Needs Review' },
        feedback: { type: String, default: '' },
      },
      structureAndReadability: {
        score: { type: Number, default: 0 },
        status: { type: String, default: 'Needs Review' },
        feedback: { type: String, default: '' },
      },
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    missingSections: {
      type: [String],
      default: [],
    },
    recommendations: {
      skillsToLearn: { type: [String], default: [] },
      technologiesForRoles: { type: [String], default: [] },
      projectIdeas: { type: [String], default: [] },
      resumeImprovements: { type: [String], default: [] },
      interviewPrepTopics: { type: [String], default: [] },
      prioritizedRoadmap: [
        {
          step: { type: Number, default: 1 },
          title: { type: String, default: '' },
          description: { type: String, default: '' },
          priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

resumeAnalysisSchema.index({ student: 1, resumeVersion: 1 });

const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
export default ResumeAnalysis;
