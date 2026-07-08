import {useState} from 'react';
import {Alert} from 'react-native';
import {sendInvoice} from '../api/paymentApi';

export const useSendInvoice = ({onSuccess}) => {
    const [loading, setLoading] = useState(false);

    const handleSend = async ({receiverId, amount, currency, description}) => {
        if (!receiverId || !amount) {
            Alert.alert('Алдаа', 'Хүлээн авагчийн ID болон дүнг оруулна уу');
            return;
        }
        setLoading(true);
        try {
            await sendInvoice({receiverId: parseInt(receiverId), amount: parseFloat(amount), currency, description});
            Alert.alert('Амжилттай', 'Нэхэмжлэл илгээгдлээ', [{text: 'OK', onPress: onSuccess}]);
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || 'Илгээж чадсангүй');
        } finally {
            setLoading(false);
        }
    };

    return {loading, handleSend};
};
