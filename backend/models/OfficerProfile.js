import mongoose from 'mongoose';

const officerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    designation: {
      type: String,
      trim: true,
      default: 'Placement Officer',
    },
    department: {
      type: String,
      trim: true,
      default: 'Training & Placement Cell',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    officeLocation: {
      type: String,
      trim: true,
      default: 'Training & Placement Office, Admin Block',
    },
    employeeId: {
      type: String,
      trim: true,
      default: '',
    },
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    profilePhoto: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const OfficerProfile = mongoose.model('OfficerProfile', officerProfileSchema);
export default OfficerProfile;
