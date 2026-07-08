import {useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {sendInvoice} from '../api/paymentApi';
import {getMyAccounts} from '../api/accountApi';
import {getMe} from '../api/userApi';

export const useCreateInvoice = ({currency, initialAmount, onSuccess}) => {
    const [myAccounts, setMyAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const userRes = await getMe();
                const accRes = await getMyAccounts(userRes.data.userId);
                setMyAccounts(accRes.data);
                if (accRes.data.length > 0) setSelectedAccountId(accRes.data[0].accountId);
            } catch {
                Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
            } finally {
                setLoadingAccounts(false);
            }
        })();
    }, []);

    const handleSubmit = async ({receiverPhone, amount, description}) => {
        if (!receiverPhone.trim()) return Alert.alert('Алдаа', 'Утасны дугаар оруулна уу');
        const finalAmount = initialAmount > 0 ? initialAmount : parseFloat(amount);
        if (!finalAmount || finalAmount <= 0) return Alert.alert('Алдаа', 'Дүн оруулна уу');
        if (!selectedAccountId) return Alert.alert('Алдаа', 'Хүлээн авах дансаа сонгоно уу');

        setSending(true);
        try {
            await sendInvoice({receiverPhone, amount: finalAmount, currency, description, receiverAccountId: selectedAccountId});
            Alert.alert('Амжилттай', 'Нэхэмжлэл илгээгдлээ', [{text: 'OK', onPress: onSuccess}]);
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || 'Илгээж чадсангүй');
        } finally {
            setSending(false);
        }
    };

    return {myAccounts, selectedAccountId, setSelectedAccountId, loadingAccounts, sending, handleSubmit};
};
