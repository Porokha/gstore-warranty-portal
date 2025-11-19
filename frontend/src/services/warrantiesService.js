import api from './api';

export const warrantiesService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const url = `/warranties${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/warranties/${id}`);
    return response.data;
  },

  getByWarrantyId: async (warrantyId) => {
    const response = await api.get(`/warranties/warranty-id/${warrantyId}`);
    return response.data;
  },

  create: async (warrantyData) => {
    const response = await api.post('/warranties', warrantyData);
    return response.data;
  },

  update: async (id, warrantyData) => {
    const response = await api.put(`/warranties/${id}`, warrantyData);
    return response.data;
  },

  extend: async (id, days) => {
    const response = await api.post(`/warranties/${id}/extend`, { days });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/warranties/${id}`);
    return response.data;
  },

  getStats: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    
    const queryString = params.toString();
    const url = `/warranties/stats${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },
};

