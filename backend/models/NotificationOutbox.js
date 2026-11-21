import mongoose from 'mongoose';

const notificationOutboxSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    jobRole: {
      type: String,
      required: true,
      trim: true,
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    roundNumber: {
      type: Number,
      default: null,
    },
    roundName: {
      type: String,
      default: '',
    },
    interviewDetails: {
      date: { type: Date, default: null },
      time: { type: String, default: '' },
      venue: { type: String, default: '' },
      description: { type: String, default: '' },
    },
    officer: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: 'Placement Officer' },
      email: { type: String, default: 'placement@mits.ac.in' },
    },
    portalUrl: {
      type: String,
      default: '',
    },
    statusTimestamp: {
      type: Date,
      default: Date.now,
    },
    emailStatus: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'failed'],
      default: 'pending',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    nextAttemptAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      default: null,
    },
    messageId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for queue worker FIFO claiming
notificationOutboxSchema.index({ emailStatus: 1, nextAttemptAt: 1, attempts: 1 });
notificationOutboxSchema.index({ application: 1, createdAt: -1 });

const NotificationOutbox = mongoose.model('NotificationOutbox', notificationOutboxSchema);
export default NotificationOutbox;
