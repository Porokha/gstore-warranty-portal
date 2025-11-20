import api from './api';

export const paymentsService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.device_type) params.append('device_type', filters.device_type);
    if (filters.payment_status) params.append('payment_status', filters.payment_status);
    if (filters.payment_method) params.append('payment_method', filters.payment_method);

    const response = await api.get(`/payments?${params.toString()}`);
    return response.data;
  },

  getByCase: async (caseId) => {
    const response = await api.get(`/payments/cases/${caseId}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  createOffer: async (caseId, offerData) => {
    const response = await api.post(`/payments/cases/${caseId}/offers`, offerData);
    return response.data;
  },

  update: async (id, updateData) => {
    const response = await api.put(`/payments/${id}`, updateData);
    return response.data;
  },

  generateCode: async (id, data) => {
    const response = await api.post(`/payments/${id}/generate-code`, data);
    return response.data;
  },

  markAsPaid: async (id, bogTransactionId) => {
    const response = await api.post(`/payments/${id}/mark-paid`, { bog_transaction_id: bogTransactionId });
    return response.data;
  },

  markAsFailed: async (id) => {
    const response = await api.post(`/payments/${id}/mark-failed`);
    return response.data;
  },

  getStats: async (caseId) => {
    const url = caseId ? `/payments/stats/summary?case_id=${caseId}` : '/payments/stats/summary';
    const response = await api.get(url);
    return response.data;
  },
};

