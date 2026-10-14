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

  getGstoreProducts: async () => {
    const response = await api.get('/trade-in/gstore-products');
    return response.data;
  },

  getAdminGstoreProducts: async () => {
    const response = await api.get('/shop/admin/trade-in/gstore-products');
    return response.data;
  },

  saveAdminGstoreProduct: async ({ id, payload }) => {
    const response = id
      ? await api.patch(`/shop/admin/trade-in/gstore-products/${id}`, payload)
      : await api.post('/shop/admin/trade-in/gstore-products', payload);
    return response.data;
  },

  deleteAdminGstoreProduct: async (id) => {
    const response = await api.delete(`/shop/admin/trade-in/gstore-products/${id}`);
    return response.data;
  },

  uploadGstoreProductImage: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/shop/admin/products/upload-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getAdminCategories: async () => {
    const response = await api.get('/shop/admin/trade-in/categories');
    return response.data;
  },

  openAdminAgreement: async (id) => {
    const response = await api.post(`/shop/admin/trade-in/quotes/${id}/agreement`);
    return response.data;
  },

  saveAdminAgreement: async (id, details) => {
    const response = await api.put(`/shop/admin/trade-in/quotes/${id}/agreement`, { details });
    return response.data;
  },

  createAgreementSigningLink: async (id) => {
    const response = await api.post(`/shop/admin/trade-in/quotes/${id}/agreement/signing-link`);
    return response.data;
  },

  setAgreementRepresentativeSignature: async (id, payload) => {
    const response = await api.put(`/shop/admin/trade-in/quotes/${id}/agreement/representative-signature`, payload);
    return response.data;
  },

  finalizeAdminAgreement: async (id) => {
    const response = await api.post(`/shop/admin/trade-in/quotes/${id}/agreement/finalize`);
    return response.data;
  },

  getAdminAgreementPdf: async (id) => {
    const response = await api.get(`/shop/admin/trade-in/quotes/${id}/agreement/pdf`, { responseType: 'blob' });
    return response.data;
  },

  getOwnTradeInSignature: async () => {
    const response = await api.get('/shop/admin/trade-in/signature');
    return response.data;
  },

  saveOwnTradeInSignature: async (signature) => {
    const response = await api.put('/shop/admin/trade-in/signature', { signature });
    return response.data;
  },

  getPublicAgreementToSign: async (token) => {
    const response = await api.get(`/trade-in/sign/${token}`);
    return response.data;
  },

  submitPublicAgreementSignature: async (token, signature) => {
    const response = await api.post(`/trade-in/sign/${token}`, { signature, accepted: true });
    return response.data;
  },

  getAdminBrands: async () => {
    const response = await api.get('/shop/admin/trade-in/brands');
    return response.data;
  },

  updateAdminBrandAvailability: async (payload) => {
    const response = await api.patch('/shop/admin/trade-in/brands/availability', payload);
    return response.data;
  },

  getAdminOfferPolicy: async () => {
    const response = await api.get('/shop/admin/trade-in/offer-policy');
    return response.data;
  },

  updateAdminOfferPolicy: async (payload) => {
    const response = await api.patch('/shop/admin/trade-in/offer-policy', payload);
    return response.data;
  },

  updateAdminCategory: async (id, payload) => {
    const response = await api.patch(`/shop/admin/trade-in/categories/${id}`, payload);
    return response.data;
  },

  reorderAdminCategories: async (categoryIds) => {
    const response = await api.patch('/shop/admin/trade-in/categories/order', { category_ids: categoryIds });
    return response.data;
  },

  getAdminProducts: async (params = {}) => {
    const response = await api.get('/shop/admin/trade-in/products', { params });
    return response.data;
  },

  getAdminProduct: async (id) => {
    const response = await api.get(`/shop/admin/trade-in/products/${id}`);
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

  updateAdminProductPricing: async (id, treeJson) => {
    const response = await api.patch(`/shop/admin/trade-in/products/${id}/pricing`, {
      tree_json: treeJson,
    });
    return response.data;
  },

  getAdminPricingExport: async () => {
    const response = await api.get('/shop/admin/trade-in/pricing/export');
    return response.data;
  },

  getAdminSelectedPricingExport: async (productIds) => {
    const response = await api.post('/shop/admin/trade-in/pricing/export-selected', {
      product_ids: productIds,
    });
    return response.data;
  },

  importAdminPricing: async (products) => {
    const response = await api.post('/shop/admin/trade-in/pricing/import', { products });
    return response.data;
  },

  replaceAdminPricing: async (productIds, treeJson) => {
    const response = await api.post('/shop/admin/trade-in/pricing/replace', {
      product_ids: productIds,
      tree_json: treeJson,
    });
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

  markAdminQuoteViewed: async (id) => {
    const response = await api.patch(`/shop/admin/trade-in/quotes/${id}/viewed`);
    return response.data;
  },

  deleteAdminQuote: async (id) => {
    const response = await api.delete(`/shop/admin/trade-in/quotes/${id}`);
    return response.data;
  },
};
