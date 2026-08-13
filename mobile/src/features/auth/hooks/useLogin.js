import {useState} from 'react';
import {Alert} from 'react-native';
import {login} from '../services/authApi';
import {useBiometric} from './useBiometric';

export const useLogin = ({onLoginSuccess}) => {
    const [loading, setLoading] = useState(false);
    const {isAvailable, isEnabled, saveCredentials, authenticate} = useBiometric();

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
            if (isAvailable && !isEnabled) {
                Alert.alert(
                    'Биометр нэвтрэлт',
                    'Дараагийн нэвтрэлтэнд Face ID / Touch ID ашиглах уу?',
                    [
                        {text: 'Үгүй', style: 'cancel', onPress: () => onLoginSuccess(data)},
                        {
                            text: 'Тийм', onPress: async () => {
                                await saveCredentials(phone, password);
                                onLoginSuccess(data);
                            },
                        },
                    ]
                );
            } else {
                onLoginSuccess(data);
            }
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || e.message || 'Нэвтрэх амжилтгүй');
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        setLoading(true);
        try {
            const credentials = await authenticate();
            if (!credentials) return;
            const data = await login(credentials);
            onLoginSuccess(data);
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || e.message || 'Нэвтрэх амжилтгүй');
        } finally {
            setLoading(false);
        }
    };

    return {loading, handleLogin, handleBiometricLogin, biometricEnabled: isEnabled, biometricAvailable: isAvailable};
};
