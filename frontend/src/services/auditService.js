import api from './api';

export const auditService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.action) params.append('action', filters.action);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const response = await api.get(`/audit?${params.toString()}`);
    return response.data;
  },
};

