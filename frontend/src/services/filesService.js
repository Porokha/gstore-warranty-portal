import api from './api';

export const filesService = {
  upload: async (caseId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/files/cases/${caseId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getByCase: async (caseId) => {
    const response = await api.get(`/files/cases/${caseId}`);
    return response.data;
  },

  delete: async (fileId) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },

  download: async (fileId) => {
    const response = await api.get(`/files/${fileId}/download`, { responseType: 'blob' });
    return response.data;
  },

};
