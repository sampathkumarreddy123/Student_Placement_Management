import api from './api';

export const copilotService = {
  // Send message to AI Placement Officer Copilot
  sendMessage: async ({ message, conversationId }) => {
    const response = await api.post('/copilot/chat', {
      message,
      conversationId,
    });
    return response.data;
  },

  // Execute an approved administrative action
  executeAction: async ({ actionType, payload, conversationId }) => {
    const response = await api.post('/copilot/execute-action', {
      actionType,
      payload,
      conversationId,
    });
    return response.data;
  },

  // Get conversation history list
  getHistory: async () => {
    const response = await api.get('/copilot/history');
    return response.data;
  },

  // Get conversation by ID
  getConversationById: async (conversationId) => {
    const response = await api.get(`/copilot/history/${conversationId}`);
    return response.data;
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/copilot/history/${conversationId}`);
    return response.data;
  },

  // Clear all conversations
  clearAllHistory: async () => {
    const response = await api.delete('/copilot/history');
    return response.data;
  },

  // Health check
  getHealth: async () => {
    const response = await api.get('/copilot/health');
    return response.data;
  },
};

export default copilotService;
