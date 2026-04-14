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

  getFileUrl: (file) => {
    const baseUrl = process.env.REACT_APP_API_URL || '/api';
    return `${baseUrl}/files/${file.id}/download`;
  },
};
