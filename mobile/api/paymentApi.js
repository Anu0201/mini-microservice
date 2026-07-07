import api from './axiosInstance';

export const getMyInvoices = () => api.get('/api/payments/invoices/user');

export const getSentInvoices = () => api.get('/api/payments/invoices/sent');

export const getInvoice = (id) => api.get(`/api/payments/invoices/${id}`);

export const createInvoice = (data) => api.post('/api/payments/invoices', data);

// data: { receiverPhone, amount, currency, description }
export const sendInvoice = (data) => api.post('/api/payments/invoices/send', data);

export const payInvoice = (id, accountId) => api.post(`/api/payments/invoices/${id}/pay`, { accountId });

export const cancelInvoice = (id) => api.post(`/api/payments/invoices/${id}/cancel`);

export const cancelMyInvoice = (id) => api.post(`/api/payments/invoices/${id}/cancel/user`);

// data: { receiverPhone, amount, currency, description, senderAccountId }
export const sendMoney = (data) => api.post('/api/payments/invoices/transfer', data);

export const getExchangeRate = (from, to) => api.get(`/api/payments/invoices/exchange-rate?from=${from}&to=${to}`);