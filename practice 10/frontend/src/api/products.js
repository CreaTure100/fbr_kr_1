import apiClient from './client';

export const productsApi = {
  create: (payload) => apiClient.post('/api/products', payload),
  getAll: () => apiClient.get('/api/products'),
  getById: (id) => apiClient.get(`/api/products/${id}`),
  updateById: (id, payload) => apiClient.put(`/api/products/${id}`, payload),
  deleteById: (id) => apiClient.delete(`/api/products/${id}`)
};