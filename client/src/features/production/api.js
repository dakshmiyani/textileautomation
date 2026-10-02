import apiClient from '../../services/apiClient';

export async function fetchProductionRecords(params = {}) {
  const { data } = await apiClient.get('/production', { params });
  return data;
}

export async function fetchProductionById(id) {
  const { data } = await apiClient.get(`/production/${id}`);
  return data.data;
}

export async function createProductionRecord(recordData) {
  const { data } = await apiClient.post('/production', recordData);
  return data.data;
}

export async function updateProductionRecord({ id, ...updateData }) {
  const { data } = await apiClient.put(`/production/${id}`, updateData);
  return data.data;
}

export async function deleteProductionRecord(id) {
  const { data } = await apiClient.delete(`/production/${id}`);
  return data;
}

export async function fetchProductionKPIs() {
  const { data } = await apiClient.get('/production/kpis');
  return data.data;
}

export async function fetchProductionAnalytics(days = 14) {
  const { data } = await apiClient.get('/production/analytics', { params: { days } });
  return data.data;
}

export async function exportProductionExcel(params = {}) {
  const response = await apiClient.get('/production/export', {
    params,
    responseType: 'blob'
  });

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `yarn_production_${new Date().toISOString().split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
