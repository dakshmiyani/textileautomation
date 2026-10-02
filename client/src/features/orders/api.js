import apiClient from '../../services/apiClient';

export async function fetchOrders(params = {}) {
  const { data } = await apiClient.get('/orders', { params });
  return data;
}

export async function fetchOrderById(id) {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data.data;
}

export async function fetchOrderMetrics() {
  const { data } = await apiClient.get('/orders/metrics/summary');
  return data.data;
}

export async function createOrder(orderData) {
  const { data } = await apiClient.post('/orders', orderData);
  return data.data;
}

export async function updateOrder({ id, ...updateData }) {
  const { data } = await apiClient.put(`/orders/${id}`, updateData);
  return data.data;
}

export async function deleteOrder(id) {
  const { data } = await apiClient.delete(`/orders/${id}`);
  return data;
}

export async function previewParseOrder(payload) {
  const { data } = await apiClient.post('/orders/preview', payload);
  return data.data;
}

export async function sendOrderWhatsApp({ id, phone }) {
  const { data } = await apiClient.post(`/orders/${id}/send-whatsapp`, { phone });
  return data;
}
