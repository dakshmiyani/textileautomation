import apiClient from '../../services/apiClient';

export async function fetchWhatsAppStatus() {
  const { data } = await apiClient.get('/whatsapp/status');
  return data.data;
}

export async function connectWhatsApp() {
  const { data } = await apiClient.post('/whatsapp/connect');
  return data.data;
}

export async function disconnectWhatsApp() {
  const { data } = await apiClient.post('/whatsapp/disconnect');
  return data.data;
}

export async function reconnectWhatsApp() {
  const { data } = await apiClient.post('/whatsapp/reconnect');
  return data.data;
}

export async function fetchMessageLogs(params = {}) {
  const { data } = await apiClient.get('/whatsapp/logs', { params });
  return data;
}
