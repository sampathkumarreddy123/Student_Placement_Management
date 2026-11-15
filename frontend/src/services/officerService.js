import api from './api';

export const officerService = {
  // Get placement officer profile details
  getProfile: async () => {
    const response = await api.get('/users/officer/profile');
    return response.data;
  },

  // Update placement officer profile details
  updateProfile: async (profileData) => {
    const response = await api.put('/users/officer/profile', profileData);
    return response.data;
  },

  // Upload officer avatar image
  uploadAvatar: async (formData) => {
    const response = await api.post('/users/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Remove officer avatar image
  deleteAvatar: async () => {
    const response = await api.delete('/users/profile/avatar');
    return response.data;
  },
};

export default officerService;
