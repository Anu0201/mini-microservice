import {useEffect, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {sendInvoice, sendSplitInvoice} from '../../../services/paymentApi';
import {getMyAccounts} from '../../../services/accountApi';
import {getMe, lookupUserByPhone} from '../../../services/userApi';
import {MIN_PHONE_LOOKUP_LENGTH, PHONE_LOOKUP_DEBOUNCE_MS} from '../../../constants';
import {createIdempotencyKey} from '../../../utils/idempotency';

export const useCreateInvoice = ({currency, initialAmount, onSuccess}) => {
    const [myAccounts, setMyAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [sending, setSending] = useState(false);

    const [receiverUser, setReceiverUser] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [currentUserPhone, setCurrentUserPhone] = useState(null); // <-- нэмэгдэв
    const lookupTimer = useRef(null);
    const sendInvoiceKeyRef = useRef(null);
    const splitInvoiceKeyRef = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                const userResponse = await getMe();
                setCurrentUserPhone(userResponse.data.phoneNumber); // <-- нэмэгдэв
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
            if (!sendInvoiceKeyRef.current) {
                sendInvoiceKeyRef.current = createIdempotencyKey('invoice-send');
            }
            await sendInvoice(
                {receiverPhone, amount: finalAmount, currency, description, receiverAccountId: selectedAccountId},
                sendInvoiceKeyRef.current
            );
            sendInvoiceKeyRef.current = null;
            Alert.alert('Амжилттай', 'Нэхэмжлэл илгээгдлээ', [{text: 'OK', onPress: onSuccess}]);
        } catch (error) {
            Alert.alert('Алдаа', error.response?.data?.message || 'Илгээж чадсангүй');
        } finally {
            setSending(false);
        }
    };

    const handleSplitSubmit = async ({totalAmount, phones, peopleCount, description}) => {
        if (!totalAmount || totalAmount <= 0) return Alert.alert('Алдаа', 'Нийт дүн оруулна уу');
        if (!selectedAccountId) return Alert.alert('Алдаа', 'Хүлээн авах дансаа сонгоно уу');
        const filledPhones = phones.filter(p => p.trim());
        if (filledPhones.length === 0) return Alert.alert('Алдаа', 'Утасны дугаар оруулна уу');

        setSending(true);
        try {
            if (!splitInvoiceKeyRef.current) {
                splitInvoiceKeyRef.current = createIdempotencyKey('invoice-split');
            }
            await sendSplitInvoice(
                {
                    phones: filledPhones,
                    participantCount: peopleCount,
                    totalAmount,
                    currency,
                    description,
                    receiverAccountId: selectedAccountId
                },
                splitInvoiceKeyRef.current
            );
            splitInvoiceKeyRef.current = null;
            Alert.alert('Амжилттай', `${filledPhones.length} хүнд нэхэмжлэл илгээгдлээ`, [{
                text: 'OK',
                onPress: onSuccess
            }]);
        } catch (error) {
            console.log('=== Split Invoice Error ===');
            console.log('Message:', error.message);
            console.log('Status:', error.response?.status);
            console.log('Response data:', JSON.stringify(error.response?.data, null, 2));
            console.log('Request config data:', error.config?.data);
            console.log('===========================');
            Alert.alert('Алдаа', error.response?.data?.message || 'Илгээж чадсангүй');
        } finally {
            setSending(false);
        }
    };

    return {
        myAccounts, selectedAccountId, setSelectedAccountId, loadingAccounts, sending,
        handleSubmit, handleSplitSubmit, receiverUser, lookupLoading, lookupPhone,
        currentUserPhone
    };
};