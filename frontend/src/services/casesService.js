import api from './api';

export const casesService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          params.append(key, filters[key].join(','));
        } else {
          params.append(key, filters[key]);
        }
      }
    });
    
    const queryString = params.toString();
    const url = `/cases${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },

  create: async (caseData) => {
    const response = await api.post('/cases', caseData);
    return response.data;
  },

  update: async (id, caseData) => {
    const response = await api.put(`/cases/${id}`, caseData);
    return response.data;
  },

  changeStatus: async (id, statusData) => {
    const response = await api.post(`/cases/${id}/status`, statusData);
    return response.data;
  },

  reopen: async (id) => {
    const response = await api.post(`/cases/${id}/reopen`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/cases/${id}`);
    return response.data;
  },
};

