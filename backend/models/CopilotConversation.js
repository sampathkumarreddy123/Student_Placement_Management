import mongoose from 'mongoose';

const copilotMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    responseType: {
      type: String,
      enum: [
        'TEXT',
        'STUDENT_TABLE',
        'DRIVE_TABLE',
        'APPLICATION_TABLE',
        'STATISTICS',
        'CHART',
        'REPORT',
        'RECOMMENDATIONS',
        'CONFIRMATION_REQUIRED',
        'CLARIFICATION_REQUIRED',
        'ERROR',
      ],
      default: 'TEXT',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    toolCalled: {
      type: String,
      default: null,
    },
    toolParameters: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const copilotConversationSchema = new mongoose.Schema(
  {
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'New Copilot Conversation',
    },
    messages: [copilotMessageSchema],
    lastContext: {
      lastTool: { type: String, default: null },
      lastParameters: { type: mongoose.Schema.Types.Mixed, default: {} },
      lastDriveId: { type: mongoose.Schema.Types.ObjectId, default: null },
      lastCompany: { type: String, default: null },
      lastDepartment: { type: String, default: null },
      lastStudentCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

copilotConversationSchema.index({ officer: 1, updatedAt: -1 });

const CopilotConversation = mongoose.model(
  'CopilotConversation',
  copilotConversationSchema
);

export default CopilotConversation;
