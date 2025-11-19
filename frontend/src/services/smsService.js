import api from './api';

export const smsService = {
  getSettings: async () => {
    const response = await api.get('/sms/settings');
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await api.put('/sms/settings', settings);
    return response.data;
  },

  getTemplates: async () => {
    const response = await api.get('/sms/templates');
    return response.data;
  },

  getTemplate: async (id) => {
    const response = await api.get(`/sms/templates/${id}`);
    return response.data;
  },

  createTemplate: async (template) => {
    const response = await api.post('/sms/templates', template);
    return response.data;
  },

  updateTemplate: async (key, language, templateText) => {
    const response = await api.put(`/sms/templates/${key}/${language}`, {
      template_text: templateText,
    });
    return response.data;
  },

  getLogs: async (limit = 100) => {
    const response = await api.get(`/sms/logs?limit=${limit}`);
    return response.data;
  },
};

