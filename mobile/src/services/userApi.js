import api from './axiosInstance';

export const register = (username, password, email, phoneNumber) =>
    api.post('/api/users', {username, password, email, phoneNumber});

export const getMe = () => api.get('/api/users/me');

export const getUserById = (id) => api.get(`/api/users/${id}`);

export const updateUser = (id, data) => api.put(`/api/users/${id}`, data);

export const lookupUserByPhone = (phoneNumber) => api.get(`/api/users/lookup/${phoneNumber}`);