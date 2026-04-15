import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Users (admin)
export const getUsers = (params) => api.get('/users', { params });
export const getUser = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Tasks
export const getTasks = (params) => api.get('/tasks', { params });
export const getTask = (id) => api.get(`/tasks/${id}`);
export const createTask = (formData) =>
  api.post('/tasks', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateTask = (id, formData) =>
  api.put(`/tasks/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// Documents
export const downloadDocument = (taskId, docId) =>
  api.get(`/tasks/${taskId}/documents/${docId}`, { responseType: 'blob' });
export const deleteDocument = (taskId, docId) =>
  api.delete(`/tasks/${taskId}/documents/${docId}`);

// Users list for assignment dropdown (any authenticated user)
export const getUsersList = () => api.get('/auth/me').then(() => api.get('/users', { params: { limit: 100 } }));

export default api;
