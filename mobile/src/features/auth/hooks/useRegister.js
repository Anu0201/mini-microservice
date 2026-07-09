import {useState} from 'react';
import {Alert} from 'react-native';
import {register} from '../../../services/userApi';

export const useRegister = ({onGoLogin}) => {
    const [loading, setLoading] = useState(false);

    const handleRegister = async ({username, password, email, phone}) => {
        if (!username || !password || !email) {
            Alert.alert('Алдаа', 'Заавал бөглөх талбаруудыг бөглөнө үү.');
            return;
        }
        setLoading(true);
        try {
            await register(username, password, email, phone);
            Alert.alert('Амжилттай', 'Бүртгэл үүслээ. Нэвтэрнэ үү.', [{text: 'OK', onPress: onGoLogin}]);
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || e.message || 'Бүртгэл амжилтгүй');
        } finally {
            setLoading(false);
        }
    };

    return {loading, handleRegister};
};
