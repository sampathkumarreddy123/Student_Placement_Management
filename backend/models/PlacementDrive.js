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
    description: {
      type: String,
      trim: true,
      default: '',
    },
    packageLPA: {
      type: Number,
      required: [true, 'Compensation (LPA) is required'],
      min: [0, 'Package cannot be negative'],
    },
    location: {
      type: String,
      trim: true,
      default: 'Flexible / Hybrid',
    },
    eligibilityCriteria: {
      minCgpa: {
        type: Number,
        default: 6.0,
        min: 0,
        max: 10,
      },
      maxBacklogs: {
        type: Number,
        default: 0,
        min: 0,
      },
      allowedDepartments: {
        type: [String],
        default: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering'],
      },
      minTenthPercentage: {
        type: Number,
        default: 60,
        min: 0,
        max: 100,
      },
      minTwelfthPercentage: {
        type: Number,
        default: 60,
        min: 0,
        max: 100,
      },
      batch: {
        type: Number,
        default: 2026,
      },
    },
    driveDate: {
      type: Date,
      required: [true, 'Drive date is required'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
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
      enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
      default: 'Upcoming',
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

const PlacementDrive = mongoose.model('PlacementDrive', placementDriveSchema);
export default PlacementDrive;

