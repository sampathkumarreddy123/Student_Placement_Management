import CopilotConversation from '../models/CopilotConversation.js';
import { processCopilotMessage } from '../services/copilotService.js';
import { executeAdminAction } from '../services/copilotActionService.js';

// @desc    Send a message to AI Placement Officer Copilot
// @route   POST /api/copilot/chat
// @access  Private (Officer only)
export const chatWithCopilot = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message query is required.',
      });
    }

    const result = await processCopilotMessage({
      message: message.trim(),
      conversationId,
      officerUser: req.user,
    });

    return res.status(200).json({
      success: true,
      conversationId: result.conversationId,
      title: result.title,
      message: result.message,
    });
  } catch (error) {
    console.error('[CopilotController.chat] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Copilot encountered an error processing your query.',
    });
  }
};

// @desc    Execute approved administrative action
// @route   POST /api/copilot/execute-action
// @access  Private (Officer only)
export const executeAction = async (req, res) => {
  try {
    const { actionType, payload, conversationId } = req.body;

    if (!actionType || !payload) {
      return res.status(400).json({
        success: false,
        message: 'Action type and payload are required for execution.',
      });
    }

    const executionResult = await executeAdminAction({
      actionType,
      payload,
      officerUser: req.user,
    });

    // Optionally append execution confirmation into conversation history
    if (conversationId) {
      try {
        const conv = await CopilotConversation.findOne({
          _id: conversationId,
          officer: req.user._id,
        });

        if (conv) {
          conv.messages.push({
            role: 'assistant',
            content: `**Action Executed**: ${executionResult.message}`,
            responseType: 'TEXT',
            data: executionResult,
            timestamp: new Date(),
          });
          await conv.save();
        }
      } catch (logErr) {
        console.warn('[CopilotController.executeAction] Conversation log update skipped:', logErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      result: executionResult,
    });
  } catch (error) {
    console.error('[CopilotController.executeAction] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to execute administrative action.',
    });
  }
};

// @desc    Get all conversations for logged-in officer
// @route   GET /api/copilot/history
// @access  Private (Officer only)
export const getHistory = async (req, res) => {
  try {
    const conversations = await CopilotConversation.find({ officer: req.user._id })
      .select('title messages createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();

    const formatted = conversations.map((c) => ({
      id: c._id,
      title: c.title || 'Untitled Conversation',
      messageCount: c.messages?.length || 0,
      lastMessage: c.messages?.[c.messages.length - 1]?.content || '',
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));

    return res.status(200).json({
      success: true,
      conversations: formatted,
    });
  } catch (error) {
    console.error('[CopilotController.getHistory] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation history.',
    });
  }
};

// @desc    Get a specific conversation by ID
// @route   GET /api/copilot/history/:conversationId
// @access  Private (Officer only)
export const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await CopilotConversation.findOne({
      _id: conversationId,
      officer: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    return res.status(200).json({
      success: true,
      conversation: {
        id: conversation._id,
        title: conversation.title,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error('[CopilotController.getConversationById] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load conversation details.',
    });
  }
};

// @desc    Delete a specific conversation
// @route   DELETE /api/copilot/history/:conversationId
// @access  Private (Officer only)
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const deleted = await CopilotConversation.findOneAndDelete({
      _id: conversationId,
      officer: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or already deleted.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully.',
    });
  } catch (error) {
    console.error('[CopilotController.deleteConversation] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete conversation.',
    });
  }
};

// @desc    Clear all conversation history for officer
// @route   DELETE /api/copilot/history
// @access  Private (Officer only)
export const clearAllHistory = async (req, res) => {
  try {
    const result = await CopilotConversation.deleteMany({ officer: req.user._id });

    return res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} conversation(s).`,
    });
  } catch (error) {
    console.error('[CopilotController.clearAllHistory] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear conversation history.',
    });
  }
};

// @desc    Health check & status
// @route   GET /api/copilot/health
// @access  Private (Officer only)
export const getCopilotHealth = async (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'online',
    version: '1.0.0',
    capabilities: [
      'searchStudents',
      'getStudentDetails',
      'getStudentEligibility',
      'getPlacementDrives',
      'getDriveApplicants',
      'getApplicationStatistics',
      'getSelectionStatistics',
      'getUpcomingDeadlines',
      'getMissingResumes',
      'getPendingApplications',
      'getPlacementSummary',
      'getStudentPreparationInsights',
      'prepareAnnouncementDraft',
      'prepareShortlistDraft',
    ],
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
};
