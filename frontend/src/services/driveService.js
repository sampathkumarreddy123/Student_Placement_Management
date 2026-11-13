import api from './api';

export const driveService = {
  getAllDrives: async (params = {}) => {
    const response = await api.get('/drives', { params });
    return response.data;
  },

  getDriveById: async (id) => {
    const response = await api.get(`/drives/${id}`);
    return response.data;
  },

  createDrive: async (driveData) => {
    const response = await api.post('/drives', driveData);
    return response.data;
  },

  updateDrive: async (id, driveData) => {
    const response = await api.put(`/drives/${id}`, driveData);
    return response.data;
  },

  publishDrive: async (id) => {
    const response = await api.patch(`/drives/${id}/publish`);
    return response.data;
  },

  closeDrive: async (id) => {
    const response = await api.patch(`/drives/${id}/close`);
    return response.data;
  },

  archiveDrive: async (id) => {
    const response = await api.patch(`/drives/${id}/archive`);
    return response.data;
  },

  deleteDrive: async (id) => {
    const response = await api.delete(`/drives/${id}`);
    return response.data;
  },
};


