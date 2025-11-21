import api from './api';

export const usersService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getTechnicians: async () => {
    const users = await usersService.getAll();
    return users.filter(user => user.role === 'technician');
  },

  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
};

