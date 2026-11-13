import api from './api';

export const studentService = {
  getMyProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateMyProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  getAllStudents: async (params = {}) => {
    const response = await api.get('/users/students', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },
};

