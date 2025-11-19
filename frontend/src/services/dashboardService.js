import api from './api';

export const dashboardService = {
  getStats: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    
    const queryString = params.toString();
    const url = `/dashboard/stats${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },
};

