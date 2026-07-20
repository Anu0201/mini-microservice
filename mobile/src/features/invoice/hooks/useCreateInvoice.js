import {useEffect, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {sendInvoice} from '../../../services/paymentApi';
import {getMyAccounts} from '../../../services/accountApi';
import {getMe, lookupUserByPhone} from '../../../services/userApi';
import {MIN_PHONE_LOOKUP_LENGTH, PHONE_LOOKUP_DEBOUNCE_MS} from '../../../constants';

export const useCreateInvoice = ({currency, initialAmount, onSuccess}) => {
    const [myAccounts, setMyAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [sending, setSending] = useState(false);

    const [receiverUser, setReceiverUser] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const lookupTimer = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                const userResponse = await getMe();
                const accountsResponse = await getMyAccounts(userResponse.data.userId);
                setMyAccounts(accountsResponse.data);
                if (accountsResponse.data.length > 0) setSelectedAccountId(accountsResponse.data[0].accountId);
            } catch {
                Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
            } finally {
                setLoadingAccounts(false);
            }
        })();
    }, []);

    const lookupPhone = (phone) => {
        setReceiverUser(null);
        if (lookupTimer.current) clearTimeout(lookupTimer.current);
        if (phone.trim().length < MIN_PHONE_LOOKUP_LENGTH) return;
        setLookupLoading(true);
        lookupTimer.current = setTimeout(async () => {
            try {
                const lookupResponse = await lookupUserByPhone(phone.trim());
                setReceiverUser(lookupResponse.data);
            } catch {
                setReceiverUser(null);
            } finally {
                setLookupLoading(false);
            }
        }, PHONE_LOOKUP_DEBOUNCE_MS);
    };

    const handleSubmit = async ({receiverPhone, amount, description}) => {
        if (!receiverPhone.trim()) return Alert.alert('Алдаа', 'Утасны дугаар оруулна уу');
        const finalAmount = initialAmount > 0 ? initialAmount : parseFloat(amount);
        if (!finalAmount || finalAmount <= 0) return Alert.alert('Алдаа', 'Дүн оруулна уу');
        if (!selectedAccountId) return Alert.alert('Алдаа', 'Хүлээн авах дансаа сонгоно уу');

        setSending(true);
        try {
            await sendInvoice({receiverPhone, amount: finalAmount, currency, description, receiverAccountId: selectedAccountId});
            Alert.alert('Амжилттай', 'Нэхэмжлэл илгээгдлээ', [{text: 'OK', onPress: onSuccess}]);
        } catch (error) {
            Alert.alert('Алдаа', error.response?.data?.message || 'Илгээж чадсангүй');
        } finally {
            setSending(false);
        }
    };

    const handleSplitSubmit = async ({totalAmount, peopleCount, phones, description}) => {
        if (!totalAmount || totalAmount <= 0) return Alert.alert('Алдаа', 'Нийт дүн оруулна уу');
        if (!peopleCount || peopleCount < 2) return Alert.alert('Алдаа', 'Хүний тоо оруулна уу');
        if (!selectedAccountId) return Alert.alert('Алдаа', 'Хүлээн авах дансаа сонгоно уу');
        const filledPhones = phones.filter(p => p.trim());
        if (filledPhones.length === 0) return Alert.alert('Алдаа', 'Утасны дугаар оруулна уу');

        const perPerson = Math.ceil(totalAmount / peopleCount);
        setSending(true);
        try {
            await Promise.all(
                filledPhones.map(phone =>
                    sendInvoice({receiverPhone: phone.trim(), amount: perPerson, currency, description, receiverAccountId: selectedAccountId})
                )
            );
            Alert.alert('Амжилттай', `${filledPhones.length} хүнд ${perPerson.toLocaleString()} ${currency} нэхэмжлэгдлээ`, [{text: 'OK', onPress: onSuccess}]);
        } catch (error) {
            Alert.alert('Алдаа', error.response?.data?.message || 'Илгээж чадсангүй');
        } finally {
            setSending(false);
        }
    };

    return {myAccounts, selectedAccountId, setSelectedAccountId, loadingAccounts, sending, handleSubmit, handleSplitSubmit, receiverUser, lookupLoading, lookupPhone};
};
