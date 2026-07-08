import {useState} from 'react';
import {Alert} from 'react-native';
import {login} from '../api/authApi';

export const useLogin = ({onLoginSuccess}) => {
    const [loading, setLoading] = useState(false);

    const handleLogin = async ({username, password}) => {
        if (!username || !password) {
            Alert.alert('Алдаа', 'Нэвтрэх нэр болон нууц үгээ оруулна уу.');
            return;
        }
        setLoading(true);
        try {
            const data = await login(username, password);
            onLoginSuccess(data);
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || e.message || 'Нэвтрэх амжилтгүй');
        } finally {
            setLoading(false);
        }
    };

    return {loading, handleLogin};
};
