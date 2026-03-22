import apiClient from './client';

export const usersApi = {
  getAll: () => apiClient.get('/api/users'),
  getById: (id) => apiClient.get(`/api/users/${id}`),
  updateById: (id, payload) => apiClient.put(`/api/users/${id}`, payload),
  blockById: (id) => apiClient.delete(`/api/users/${id}`)
};