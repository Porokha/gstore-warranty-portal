import api from './api';

export const shopService = {
  getPublicProducts: async () => {
    const response = await api.get('/public/shop/products');
    return response.data;
  },

  getAdminProducts: async () => {
    const response = await api.get('/shop/admin/products');
    return response.data;
  },

  createProduct: async (payload) => {
    const response = await api.post('/shop/admin/products', payload);
    return response.data;
  },

  updateProduct: async (id, payload) => {
    const response = await api.put(`/shop/admin/products/${id}`, payload);
    return response.data;
  },

  getOrders: async () => {
    const response = await api.get('/shop/admin/orders');
    return response.data;
  },

  updateOrder: async (id, payload) => {
    const response = await api.patch(`/shop/admin/orders/${id}`, payload);
    return response.data;
  },
};
