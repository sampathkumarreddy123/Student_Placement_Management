import api from './api';

export const applicationService = {
  applyForDrive: async (driveId) => {
    const response = await api.post(`/applications/apply/${driveId}`);
    return response.data;
  },

  getMyApplications: async (params = {}) => {
    const response = await api.get('/applications/my', { params });
    return response.data;
  },

  getApplicationById: async (id) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  getDriveApplicants: async (driveId, params = {}) => {
    const queryParams = typeof params === 'string' ? { status: params } : params;
    const response = await api.get(`/applications/drive/${driveId}`, {
      params: queryParams,
    });
    return response.data;
  },

  downloadApplicantResume: async (applicationId) => {
    const response = await api.get(`/applications/${applicationId}/resume`, {
      responseType: 'blob',
    });
    return response;
  },

  previewApplicantResume: async (applicationId) => {
    const response = await api.get(`/applications/${applicationId}/resume`, {
      params: { inline: 'true' },
      responseType: 'blob',
    });
    return response;
  },

  getAllApplications: async (params = {}) => {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  updateStatus: async (applicationId, updateData) => {
    const response = await api.patch(`/applications/${applicationId}/status`, updateData);
    return response.data;
  },

  screenDriveApplicants: async (driveId) => {
    const response = await api.post(`/applications/drive/${driveId}/ai-screen`);
    return response.data;
  },

  screenSingleApplicant: async (applicationId) => {
    const response = await api.post(`/applications/${applicationId}/ai-screen`);
    return response.data;
  },

  getEmailStatus: async (applicationId) => {
    const response = await api.get(`/applications/${applicationId}/email-status`);
    return response.data;
  },

  retryEmail: async (outboxId) => {
    const response = await api.post(`/applications/notifications/${outboxId}/retry`);
    return response.data;
  },
};

