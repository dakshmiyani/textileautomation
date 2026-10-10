import apiClient from '../../services/apiClient';

export async function loginUser(credentials) {
  const { data } = await apiClient.post('/auth/login', credentials);
  return data.data;
}

export async function logoutUser() {
  const { data } = await apiClient.post('/auth/logout');
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get('/auth/me');
  return data.data;
}

export async function updateProfile(profileData) {
  const { data } = await apiClient.put('/auth/me', profileData);
  return data.data;
}
