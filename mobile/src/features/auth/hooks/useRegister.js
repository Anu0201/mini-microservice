import {useState} from 'react';
import {Alert} from 'react-native';
import {register} from '../../../services/userApi';
import {login} from '../services/authApi';

export const useRegister = ({onRegisterSuccess, onGoLogin}) => {
    const [loading, setLoading] = useState(false);

    const handleRegister = async ({username, password, email, phone}) => {
        if (!username || !password || !email) {
            Alert.alert('Алдаа', 'Заавал бөглөх талбаруудыг бөглөнө үү.');
            return;
        }
        setLoading(true);
        try {
            await register(username, password, email, phone);
            const loginData = await login({phone, password});
            onRegisterSuccess(loginData);
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || e.message || 'Бүртгэл амжилтгүй');
        } finally {
            setLoading(false);
        }
    };

    return {loading, handleRegister};
};
