import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8060'
    : 'http://172.20.10.4:8060';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const token = await AsyncStorage.getItem('token');
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await AsyncStorage.setItem('token', data.token);
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch {
        await AsyncStorage.multiRemove(['token', 'username', 'roles']);
      }
    }

    return Promise.reject(error);
  }
);

export default api;