import apiClient from './client';

export const authApi = {
  register: (payload) => apiClient.post('/api/auth/register', payload),
  login: (payload) => apiClient.post('/api/auth/login', payload),
  me: () => apiClient.get('/api/auth/me'),
  refresh: (refreshToken) => apiClient.post('/api/auth/refresh', { refreshToken })
};