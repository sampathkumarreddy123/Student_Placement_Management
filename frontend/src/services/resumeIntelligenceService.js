import api from './api';

export const resumeIntelligenceService = {
  // ==========================================
  // STUDENT APIS
  // ==========================================

  // Upload resume (PDF or DOCX) & trigger AI analysis
  uploadResume: async (formData) => {
    const response = await api.post('/ai-resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Trigger analysis on existing uploaded resume
  analyzeResume: async () => {
    const response = await api.post('/ai-resume/analyze');
    return response.data;
  },

  // Get current student's AI resume analysis report
  getAnalysis: async () => {
    const response = await api.get('/ai-resume/analysis');
    return response.data;
  },

  // Get AI Job Matches against all active drives
  getJobMatches: async (params = {}) => {
    const response = await api.get('/ai-resume/matches', { params });
    return response.data;
  },

  // Get single drive match breakdown
  getDriveMatch: async (driveId) => {
    const response = await api.get(`/ai-resume/matches/${driveId}`);
    return response.data;
  },

  // Refresh single drive match
  refreshDriveMatch: async (driveId) => {
    const response = await api.post(`/ai-resume/matches/${driveId}/refresh`);
    return response.data;
  },

  // ==========================================
  // OFFICER APIS
  // ==========================================

  // Get aggregate skill-demand analytics & student resume stats
  getOfficerInsights: async () => {
    const response = await api.get('/officer/ai-resume/insights');
    return response.data;
  },

  // Get detailed resume analysis for a specific student
  getOfficerStudentAnalysis: async (studentId) => {
    const response = await api.get(`/officer/ai-resume/students/${studentId}`);
    return response.data;
  },

  // Get candidate matching rankings for a specific drive
  getOfficerDriveMatches: async (driveId) => {
    const response = await api.get(`/officer/ai-resume/drives/${driveId}/matches`);
    return response.data;
  },
};

export default resumeIntelligenceService;
