import mongoose from 'mongoose';

const recruitmentRoundSchema = new mongoose.Schema(
  {
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: [true, 'Associated placement drive is required'],
      index: true,
    },
    roundNumber: {
      type: Number,
      required: [true, 'Round sequence number is required'],
      min: [1, 'Round number must be at least 1'],
    },
    name: {
      type: String,
      required: [true, 'Round name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
    },
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid'],
      default: 'Online',
    },
    venue: {
      type: String,
      default: '',
      trim: true,
    },
    isFinalRound: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Scheduled',
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

// Ensure unique round number per placement drive
recruitmentRoundSchema.index({ drive: 1, roundNumber: 1 }, { unique: true });

const RecruitmentRound = mongoose.model('RecruitmentRound', recruitmentRoundSchema);
export default RecruitmentRound;
