import {useState} from 'react';
import {Alert} from 'react-native';
import {register} from '../../../services/userApi';
import {login} from '../services/authApi';

export const useRegister = ({onRegisterSuccess, onGoLogin}) => {
    const [loading, setLoading] = useState(false);

    const handleRegister = async ({firstName, lastName, password, email, phone}) => {
        if (!firstName || !lastName || !password || !email || !phone) {
            Alert.alert('Алдаа', 'Заавал бөглөх талбаруудыг бөглөнө үү.');
            return;
        }
        setLoading(true);
        try {
            await register(firstName, lastName, password, email, phone);
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
