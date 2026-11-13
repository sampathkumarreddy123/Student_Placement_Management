import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    batch: {
      type: Number,
      required: [true, 'Graduation batch year is required'],
    },
    cgpa: {
      type: Number,
      required: [true, 'CGPA is required'],
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10'],
    },
    backlogs: {
      type: Number,
      default: 0,
      min: [0, 'Backlogs cannot be negative'],
    },
    tenthPercentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
      default: 0,
    },
    twelfthPercentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
      default: 0,
    },
    phone: {
      type: String,
      trim: true,
    },
    resumeUrl: {
      type: String,
      trim: true,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    placementStatus: {
      type: String,
      enum: ['Not Placed', 'Placed'],
      default: 'Not Placed',
    },
    placedCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile;

