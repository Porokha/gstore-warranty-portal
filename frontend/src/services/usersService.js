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
};

