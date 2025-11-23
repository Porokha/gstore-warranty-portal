import api from './api';

export const statisticsService = {
  getTechnicianStats: async (technicianId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (technicianId) params.append('technician_id', technicianId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    const url = `/statistics/technicians${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  getAllTechniciansStats: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    const url = `/statistics/technicians/all${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  exportTechnicianStats: async (technicianId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (technicianId) params.append('technician_id', technicianId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    const url = `/statistics/technicians/export${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, { responseType: 'blob' });
    
    // Create download link
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `technician-statistics-${technicianId || 'all'}-${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportAllTechniciansStats: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    const url = `/statistics/technicians/all/export${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url, { responseType: 'blob' });
    
    // Create download link
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `all-technicians-statistics-${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

