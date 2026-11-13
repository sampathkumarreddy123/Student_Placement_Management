import api from './api';

export const companyService = {
  getCompanies: async (params = {}) => {
    const response = await api.get('/companies', { params });
    return response.data;
  },

  getCompanyById: async (id) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  createCompany: async (companyData) => {
    const response = await api.post('/companies', companyData);
    return response.data;
  },

  updateCompany: async (id, companyData) => {
    const response = await api.put(`/companies/${id}`, companyData);
    return response.data;
  },

  uploadLogo: async (id, formData) => {
    const response = await api.post(`/companies/${id}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteCompany: async (id, archive = false) => {
    const response = await api.delete(`/companies/${id}`, {
      params: archive ? { archive: 'true' } : {},
    });
    return response.data;
  },

  toggleArchive: async (id) => {
    const response = await api.patch(`/companies/${id}/archive`);
    return response.data;
  },
};
