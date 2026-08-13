import api from './axiosInstance';

export const register = (firstName, lastName, password, email, phoneNumber) =>
    api.post('/api/users', {firstName, lastName, password, email, phoneNumber});

export const getMe = () => api.get('/api/users/me');

export const getUserById = (id) => api.get(`/api/users/${id}`);

export const updateUser = (id, data) => api.put(`/api/users/${id}`, data);

export const lookupUserByPhone = (phoneNumber) => api.get(`/api/users/lookup/${phoneNumber}`);

export const uploadProfileImage = (uri) => {
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('file', {uri, name: filename, type});
    return api.post('/api/users/me/profile-image', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
    });
};