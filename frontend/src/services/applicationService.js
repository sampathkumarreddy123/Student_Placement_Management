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

  getDriveApplicants: async (driveId, status = '') => {
    const response = await api.get(`/applications/drive/${driveId}`, {
      params: status ? { status } : {},
    });
    return response.data;
  },

  getAllApplications: async (params = {}) => {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  updateStatus: async (applicationId, updateData) => {
    const response = await api.patch(`/applications/${applicationId}/status`, updateData);
    return response.data;
  },
};

