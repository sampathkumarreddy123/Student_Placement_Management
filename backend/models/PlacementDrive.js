import mongoose from 'mongoose';

const placementDriveSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Associated company is required'],
    },
    title: {
      type: String,
      required: [true, 'Drive title is required'],
      trim: true,
    },
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
    },
    jobDescription: {
      type: String,
      trim: true,
      default: '',
    },
    // Keep description in sync with jobDescription
    description: {
      type: String,
      trim: true,
      default: '',
    },
    packageLPA: {
      type: Number,
      required: [true, 'Compensation / Package (LPA) is required'],
      min: [0, 'Package cannot be negative'],
    },
    location: {
      type: String,
      trim: true,
      default: 'Flexible / Hybrid',
    },
    employmentType: {
      type: String,
      enum: ['Full-Time', 'Internship', 'Internship + Full-Time', 'Contract'],
      default: 'Full-Time',
    },
    vacancies: {
      type: Number,
      min: [1, 'Vacancies must be at least 1'],
      default: 5,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    eligibilityCriteria: {
      minCgpa: {
        type: Number,
        default: 6.0,
        min: [0, 'Min CGPA cannot be negative'],
        max: [10, 'Min CGPA cannot exceed 10'],
      },
      minTenthPercentage: {
        type: Number,
        default: 60,
        min: [0, 'Percentage cannot be negative'],
        max: [100, 'Percentage cannot exceed 100'],
      },
      minTwelfthPercentage: {
        type: Number,
        default: 60,
        min: [0, 'Percentage cannot be negative'],
        max: [100, 'Percentage cannot exceed 100'],
      },
      allowedDepartments: {
        type: [String],
        default: [
          'Computer Science',
          'Information Technology',
          'Electronics & Communication',
          'Electrical Engineering',
        ],
      },
      batch: {
        type: Number,
        default: 2026,
      },
      maxActiveBacklogs: {
        type: Number,
        default: 0,
        min: [0, 'Active backlogs cannot be negative'],
      },
      maxTotalBacklogs: {
        type: Number,
        default: 0,
        min: [0, 'Total backlogs cannot be negative'],
      },
      // Keep maxBacklogs synced with maxActiveBacklogs
      maxBacklogs: {
        type: Number,
        default: 0,
      },
    },
    applicationOpeningDate: {
      type: Date,
      default: Date.now,
    },
    applicationClosingDate: {
      type: Date,
      required: [true, 'Application closing date is required'],
    },
    // Keep driveDate and registrationDeadline synced
    driveDate: {
      type: Date,
    },
    registrationDeadline: {
      type: Date,
    },
    rounds: [
      {
        roundNumber: { type: Number, default: 1 },
        roundName: { type: String, required: true },
        description: { type: String, default: '' },
        date: { type: Date },
      },
    ],
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Closed', 'Completed', 'Upcoming', 'Ongoing', 'Cancelled'],
      default: 'Draft',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Sync duplicate fields and validate dates
placementDriveSchema.pre('save', function (next) {
  if (this.jobDescription && !this.description) {
    this.description = this.jobDescription;
  } else if (this.description && !this.jobDescription) {
    this.jobDescription = this.description;
  }

  if (this.applicationClosingDate) {
    this.registrationDeadline = this.applicationClosingDate;
  } else if (this.registrationDeadline) {
    this.applicationClosingDate = this.registrationDeadline;
  }

  if (!this.driveDate && this.applicationClosingDate) {
    // Default drive date to closing date + 7 days if not provided
    this.driveDate = new Date(this.applicationClosingDate.getTime() + 7 * 86400000);
  }

  if (this.eligibilityCriteria) {
    if (this.eligibilityCriteria.maxActiveBacklogs !== undefined) {
      this.eligibilityCriteria.maxBacklogs = this.eligibilityCriteria.maxActiveBacklogs;
    } else if (this.eligibilityCriteria.maxBacklogs !== undefined) {
      this.eligibilityCriteria.maxActiveBacklogs = this.eligibilityCriteria.maxBacklogs;
    }
  }

  // Date validation: closing date must be after opening date
  if (
    this.applicationOpeningDate &&
    this.applicationClosingDate &&
    new Date(this.applicationClosingDate) <= new Date(this.applicationOpeningDate)
  ) {
    return next(new Error('Application closing date must be strictly after the opening date.'));
  }

  next();
});

const PlacementDrive = mongoose.model('PlacementDrive', placementDriveSchema);
export default PlacementDrive;
