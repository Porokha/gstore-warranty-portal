import api from './api';

export const maintenanceService = {
  getScores: async () => {
    const response = await api.get('/public/maintenance/scores', {
      skipAuthRedirect: true,
    });
    return response.data;
  },

  saveScore: async (payload) => {
    const response = await api.post('/public/maintenance/scores', payload, {
      skipAuthRedirect: true,
    });
    return response.data;
  },
};
