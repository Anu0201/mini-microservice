import api from './axiosInstance';

export const getMyAccounts = (userId) => api.get(`/api/accounts/users/${userId}`);
export const getAccount = (accountId) => api.get(`/api/accounts/${accountId}`);
export const createAccount = (userId, currency) => api.post(`/api/accounts/users/${userId}`, { currency });
export const deposit = (accountId, amount) => api.post(`/api/accounts/${accountId}/deposit`, { amount });
export const withdraw = (accountId, amount) => api.post(`/api/accounts/${accountId}/withdraw`, { amount });
export const getTransactions = (accountId) => api.get(`/api/accounts/${accountId}/transactions`);