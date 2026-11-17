import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  officerLogin: async (credentials) => {
    const response = await api.post('/auth/officer/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  studentLogin: async (credentials) => {
    const response = await api.post('/auth/student/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  registerOfficer: async (officerData) => {
    const response = await api.post('/auth/officer/create', officerData, {
      headers: {
        'x-setup-token': officerData.setupToken,
      },
    });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  verifyEmail: async (token) => {
    const cleanToken = (token || '').trim();
    const response = await api.get(`/auth/verify-email/${cleanToken}`);
    return response.data;
  },

  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  getSecurityQuestions: async (identifier) => {
    const cleanId = (identifier || '').trim();
    try {
      const response = await api.post('/auth/security-questions', {
        identifier: cleanId,
      });
      return response.data;
    } catch (error) {
      const status = error.status || error.response?.status;
      if (status === 404) {
        // Fallback for direct mounting without /auth prefix
        const fallbackRes = await api.post('/security-questions', {
          identifier: cleanId,
        });
        return fallbackRes.data;
      }
      throw error;
    }
  },

  verifySecurityQuestions: async (identifier, answers) => {
    const cleanId = (identifier || '').trim();
    try {
      const response = await api.post('/auth/verify-security-questions', {
        identifier: cleanId,
        answers,
      });
      return response.data;
    } catch (error) {
      const status = error.status || error.response?.status;
      if (status === 404) {
        // Fallback for direct mounting without /auth prefix
        const fallbackRes = await api.post('/verify-security-questions', {
          identifier: cleanId,
          answers,
        });
        return fallbackRes.data;
      }
      throw error;
    }
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, passwords) => {
    const cleanToken = (token || passwords?.token || '').trim();
    const response = await api.post(`/auth/reset-password/${cleanToken}`, {
      ...passwords,
      token: cleanToken,
    });
    return response.data;
  },

  getMySecurityQuestions: async () => {
    try {
      const response = await api.get('/auth/my-security-questions');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        const fallbackRes = await api.get('/my-security-questions');
        return fallbackRes.data;
      }
      throw error;
    }
  },

  changePassword: async (passwords) => {
    const response = await api.put('/auth/change-password', passwords);
    return response.data;
  },
};

