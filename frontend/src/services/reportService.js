import api from './api';

export const reportService = {
  // Get high-level summary KPIs (registered, eligible, companies, drives, applications, selected, rejected, rates)
  getStatistics: async (params = {}) => {
    const response = await api.get('/reports/statistics', { params });
    return response.data;
  },

  // Get all 7 comprehensive reports (department, company, batch, drive, status, round, package distribution)
  getAnalytics: async (params = {}) => {
    const response = await api.get('/reports/analytics', { params });
    return response.data;
  },

  // Export applicant lists
  exportApplicants: async (params = {}) => {
    const response = await api.get('/reports/export/applicants', { params });
    return response.data;
  },

  // Export selected / placed students
  exportSelected: async (params = {}) => {
    const response = await api.get('/reports/export/selected', { params });
    return response.data;
  },
};

export default reportService;
