import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './axiosInstance';

export const login = async (username, password) => {
  const { data } = await api.post('/api/auth/login', { username, password });
  await AsyncStorage.multiSet([
    ['token', data.token],
    ['username', data.username],
    ['roles', JSON.stringify(data.roles)],
  ]);
  return data;
};

export const logout = async () => {
  await api.post('/api/auth/logout');
  await AsyncStorage.multiRemove(['token', 'username', 'roles']);
};

export const getLoginHistory = () => api.get('/api/auth/history/user');