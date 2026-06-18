import api from './api';

export const notificationsService = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markRead: async (id) => {
    await api.post(`/notifications/${id}/read`);
  },

  markAllRead: async () => {
    await api.post('/notifications/read-all');
  },
};
