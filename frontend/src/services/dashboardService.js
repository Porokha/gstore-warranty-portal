import api from './api';

export const dashboardService = {
  getStats: async (startDate, endDate, deviceType) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate.toISOString());
    if (endDate) params.append('end', endDate.toISOString());
    if (deviceType) params.append('device_type', deviceType);
    
    const queryString = params.toString();
    const url = `/dashboard/stats${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },
};

