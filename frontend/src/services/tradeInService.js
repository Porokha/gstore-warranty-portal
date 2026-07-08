import api from './api';

export const tradeInService = {
  getCategories: async () => {
    const response = await api.get('/trade-in/categories');
    return response.data;
  },

  getBrands: async (category) => {
    const response = await api.get('/trade-in/brands', { params: { category } });
    return response.data;
  },

  getSeries: async (category, brand) => {
    const response = await api.get('/trade-in/series', { params: { category, brand } });
    return response.data;
  },

  getProducts: async (params = {}) => {
    const response = await api.get('/trade-in/products', { params });
    return response.data;
  },

  getProduct: async (slug) => {
    const response = await api.get('/trade-in/product', { params: { slug } });
    return response.data;
  },

  createQuote: async (payload) => {
    const response = await api.post('/trade-in/quotes', payload);
    return response.data;
  },

  getAdminCategories: async () => {
    const response = await api.get('/shop/admin/trade-in/categories');
    return response.data;
  },

  updateAdminCategory: async (id, payload) => {
    const response = await api.patch(`/shop/admin/trade-in/categories/${id}`, payload);
    return response.data;
  },

  getAdminProducts: async (params = {}) => {
    const response = await api.get('/shop/admin/trade-in/products', { params });
    return response.data;
  },

  getAdminProductSubcategories: async (category) => {
    const response = await api.get('/shop/admin/trade-in/products/subcategories', {
      params: { category },
    });
    return response.data;
  },

  updateAdminProduct: async (id, payload) => {
    const response = await api.patch(`/shop/admin/trade-in/products/${id}`, payload);
    return response.data;
  },

  getAdminQuotes: async (params = {}) => {
    const response = await api.get('/shop/admin/trade-in/quotes', { params });
    return response.data;
  },

  getAdminQuoteCounts: async () => {
    const response = await api.get('/shop/admin/trade-in/quotes/counts');
    return response.data;
  },

  updateAdminQuote: async (id, payload) => {
    const response = await api.patch(`/shop/admin/trade-in/quotes/${id}`, payload);
    return response.data;
  },

  deleteAdminQuote: async (id) => {
    const response = await api.delete(`/shop/admin/trade-in/quotes/${id}`);
    return response.data;
  },
};
