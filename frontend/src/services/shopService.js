import api from './api';

export const shopService = {
  getPublicProducts: async () => {
    const response = await api.get('/public/shop/products');
    return response.data;
  },

  getAdminProducts: async (scope = 'active') => {
    const response = await api.get('/shop/admin/products', {
      params: { scope },
    });
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

  deleteProduct: async (id) => {
    const response = await api.delete(`/shop/admin/products/${id}`);
    return response.data;
  },

  restoreProduct: async (id) => {
    const response = await api.patch(`/shop/admin/products/${id}/restore`);
    return response.data;
  },

  permanentlyDeleteProduct: async (id) => {
    const response = await api.delete(`/shop/admin/products/${id}/permanent`);
    return response.data;
  },

  importProductsCsv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/shop/admin/products/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  downloadProductsCsvTemplate: async () => {
    const response = await api.get('/shop/admin/products/import/csv/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/shop/admin/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getOrders: async (scope = 'active') => {
    const response = await api.get('/shop/admin/orders', {
      params: { scope },
    });
    return response.data;
  },

  updateOrder: async (id, payload) => {
    const response = await api.patch(`/shop/admin/orders/${id}`, payload);
    return response.data;
  },

  deleteOrder: async (id) => {
    const response = await api.delete(`/shop/admin/orders/${id}`);
    return response.data;
  },

  restoreOrder: async (id) => {
    const response = await api.patch(`/shop/admin/orders/${id}/restore`);
    return response.data;
  },

  permanentlyDeleteOrder: async (id) => {
    const response = await api.delete(`/shop/admin/orders/${id}/permanent`);
    return response.data;
  },
};
