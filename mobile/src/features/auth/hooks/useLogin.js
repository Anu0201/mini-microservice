import {useState} from 'react';
import {Alert} from 'react-native';
import {login} from '../services/authApi';

export const useLogin = ({onLoginSuccess}) => {
    const [loading, setLoading] = useState(false);

    const handleLogin = async ({phone, password}) => {
        if (!phone) {
            Alert.alert('Алдаа', 'Утасны дугаараа оруулна уу.');
            return;
        }
        if (!password) {
            Alert.alert('Алдаа', 'Нууц үгээ оруулна уу.');
            return;
        }
        setLoading(true);
        try {
            const data = await login({phone, password});
            onLoginSuccess(data);
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || e.message || 'Нэвтрэх амжилтгүй');
        } finally {
            setLoading(false);
        }
    };

    return {loading, handleLogin};
};
