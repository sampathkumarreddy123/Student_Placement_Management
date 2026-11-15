import api from './api';

export const roundService = {
  // Get all rounds with candidate stats for a placement drive
  getRoundsByDrive: async (driveId) => {
    const response = await api.get(`/rounds/drive/${driveId}`);
    return response.data;
  },

  // Create a new round for a drive
  createRound: async (driveId, roundData) => {
    const response = await api.post(`/rounds/drive/${driveId}`, roundData);
    return response.data;
  },

  // Update round details
  updateRound: async (roundId, roundData) => {
    const response = await api.put(`/rounds/${roundId}`, roundData);
    return response.data;
  },

  // Delete a round
  deleteRound: async (roundId) => {
    const response = await api.delete(`/rounds/${roundId}`);
    return response.data;
  },

  // Get candidates in a specific round
  getRoundCandidates: async (roundId) => {
    const response = await api.get(`/rounds/${roundId}/candidates`);
    return response.data;
  },

  // Evaluate candidate in round (Passed, Failed, Pending, Absent)
  evaluateCandidate: async (roundId, applicationId, evaluationData) => {
    const response = await api.put(
      `/rounds/${roundId}/candidate/${applicationId}/evaluate`,
      evaluationData
    );
    return response.data;
  },

  // Advance all qualified students to the next round
  moveQualified: async (roundId) => {
    const response = await api.post(`/rounds/${roundId}/move-qualified`);
    return response.data;
  },

  // Student view of rounds for an applied drive
  getStudentDriveRounds: async (driveId) => {
    const response = await api.get(`/rounds/drive/${driveId}/student-view`);
    return response.data;
  },
};

export default roundService;
