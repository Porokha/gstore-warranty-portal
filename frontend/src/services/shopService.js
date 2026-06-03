import api from './api';

export const shopService = {
  getPublicFlags: async () => {
    const response = await api.get('/public/app-flags');
    return response.data;
  },

  getPublicProducts: async () => {
    const response = await api.get('/public/shop/products');
    return response.data;
  },

  createPublicOrder: async (payload) => {
    const response = await api.post('/public/shop/orders', payload);
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

  previewMobileSentrixProducts: async ({ query, maxResults = 10, startIndex = 0 }) => {
    const response = await api.get('/integrations/mobilesentrix/products/preview', {
      params: {
        q: query,
        max_results: maxResults,
        start_index: startIndex,
      },
      skipAuthRedirect: true,
    });
    return response.data;
  },

  syncMobileSentrixProducts: async ({ query, maxResults = 25, startIndex = 0 }) => {
    const response = await api.post(
      '/integrations/mobilesentrix/products/sync',
      {
        q: query,
        max_results: maxResults,
        start_index: startIndex,
      },
      { skipAuthRedirect: true },
    );
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

  getAdminSettings: async () => {
    const response = await api.get('/settings/public-maintenance');
    return response.data;
  },

  updateAdminSettings: async (payload) => {
    const response = await api.post('/settings/public-maintenance', payload);
    return response.data;
  },
};
