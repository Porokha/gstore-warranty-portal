import api from './api';

export const slaService = {
  getMetrics: async () => {
    const response = await api.get('/sla/metrics');
    return response.data;
  },

  getCasesCloseToDeadline: async (days = 1) => {
    const response = await api.get(`/sla/cases/close-to-deadline?days=${days}`);
    return response.data;
  },

  getDueCases: async () => {
    const response = await api.get('/sla/cases/due');
    return response.data;
  },

  getStalledCases: async (days = 3) => {
    const response = await api.get(`/sla/cases/stalled?days=${days}`);
    return response.data;
  },

  checkAlerts: async () => {
    const response = await api.post('/sla/check-alerts');
    return response.data;
  },
};

