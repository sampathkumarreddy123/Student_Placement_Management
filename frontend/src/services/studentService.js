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

  uploadResume: async (formData) => {
    const response = await api.post('/users/profile/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadAvatar: async (formData) => {
    const response = await api.post('/users/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadResume: async () => {
    const response = await api.get('/users/profile/resume/download', {
      responseType: 'blob',
    });
    return response;
  },

  getAllStudents: async (params = {}) => {
    const response = await api.get('/users/students', { params });
    return response.data;
  },

  getStudentById: async (id) => {
    const response = await api.get(`/users/students/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  getOfficerDashboard: async () => {
    const response = await api.get('/users/officer/dashboard');
    return response.data;
  },
};
