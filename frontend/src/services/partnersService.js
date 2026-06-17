import api from './api';

export const partnersService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const queryString = params.toString();
    const response = await api.get(`/partners${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/partners/${id}`);
    return response.data;
  },

  create: async (partnerData) => {
    const response = await api.post('/partners', partnerData);
    return response.data;
  },

  update: async (id, partnerData) => {
    const response = await api.put(`/partners/${id}`, partnerData);
    return response.data;
  },

  getCases: async (id) => {
    const response = await api.get(`/partners/${id}/cases`);
    return response.data;
  },
};
