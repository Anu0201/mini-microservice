import api from './axiosInstance';

export const createPin = (pin) => api.post('/api/users/pin/create', {pin});
export const changePin = (pin) => api.post('/api/users/pin/change', {pin});
export const recoverPin = (pin) => api.post('/api/users/pin/recover', {pin});
export const checkPin = (pin) => api.post('/api/users/pin/check', {pin});