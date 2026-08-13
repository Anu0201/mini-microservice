import {useEffect, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {sendInvoice, sendSplitInvoice} from '../../../services/paymentApi';
import {getMyAccounts} from '../../../services/accountApi';
import {getMe, lookupUserByPhone} from '../../../services/userApi';
import {checkPin} from '../../../services/pinApi';
import {MIN_PHONE_LOOKUP_LENGTH, PHONE_LOOKUP_DEBOUNCE_MS} from '../../../constants';
import {createIdempotencyKey} from '../../../utils/idempotency';

const normalizePhone = (phone) => String(phone ?? '').replace(/\D/g, '');

export const useCreateInvoice = ({currency, initialAmount, onSuccess}) => {
    const [myAccounts, setMyAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [sending, setSending] = useState(false);

    // Multi-recipient state (non-split mode)
    const [recipients, setRecipients] = useState([]); // [{phone, user}]
    const [phoneInput, setPhoneInput] = useState('');
    const [lookupUser, setLookupUser] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [currentUserPhone, setCurrentUserPhone] = useState(null);
    const lookupTimer = useRef(null);

    const splitInvoiceKeyRef = useRef(null);

    const [pinVisible, setPinVisible] = useState(false);
    const pendingSubmitRef = useRef(null); // {type: 'multi'|'split', data}

    useEffect(() => {
        (async () => {
            try {
                const userRes = await getMe();
                setCurrentUserPhone(userRes.data.phoneNumber);
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

    // Phone lookup for non-split mode
    useEffect(() => {
        const phone = phoneInput.trim();
        setLookupUser(null);
        if (lookupTimer.current) clearTimeout(lookupTimer.current);
        if (phone.length < MIN_PHONE_LOOKUP_LENGTH) return;
        if (currentUserPhone && normalizePhone(phone) === normalizePhone(currentUserPhone)) return;
        if (recipients.some((r) => normalizePhone(r.phone) === normalizePhone(phone))) return;
        setLookupLoading(true);
        lookupTimer.current = setTimeout(async () => {
            try {
                const res = await lookupUserByPhone(phone);
                setLookupUser(res.data);
            } catch {
                setLookupUser(null);
            } finally {
                setLookupLoading(false);
            }
        }, PHONE_LOOKUP_DEBOUNCE_MS);
        return () => clearTimeout(lookupTimer.current);
    }, [phoneInput]);

    const addRecipient = () => {
        const phone = phoneInput.trim();
        if (!lookupUser || !phone) return;
        if (recipients.some((r) => normalizePhone(r.phone) === normalizePhone(phone))) return;
        setRecipients((prev) => [...prev, {phone, user: lookupUser}]);
        setPhoneInput('');
        setLookupUser(null);
    };

    const removeRecipient = (phone) => {
        setRecipients((prev) => prev.filter((r) => r.phone !== phone));
    };

    // Non-split: send same invoice amount to each recipient
    const handleSubmit = ({amount, description}) => {
        if (recipients.length === 0) return Alert.alert('Алдаа', 'Хүлээн авагч нэмнэ үү');
        const finalAmount = initialAmount > 0 ? initialAmount : parseFloat(amount);
        if (!finalAmount || finalAmount <= 0) return Alert.alert('Алдаа', 'Дүн оруулна уу');
        if (!selectedAccountId) return Alert.alert('Алдаа', 'Хүлээн авах дансаа сонгоно уу');

        pendingSubmitRef.current = {
            type: 'multi',
            data: {phones: recipients.map((r) => r.phone), amount: finalAmount, description},
        };
        setPinVisible(true);
    };

    const handleSplitSubmit = ({totalAmount, phones, peopleCount, description}) => {
        if (!totalAmount || totalAmount <= 0) return Alert.alert('Алдаа', 'Нийт дүн оруулна уу');
        if (!selectedAccountId) return Alert.alert('Алдаа', 'Хүлээн авах дансаа сонгоно уу');
        const filledPhones = phones.filter((p) => p.trim());
        if (filledPhones.length === 0) return Alert.alert('Алдаа', 'Утасны дугаар оруулна уу');

        pendingSubmitRef.current = {type: 'split', data: {totalAmount, phones: filledPhones, peopleCount, description}};
        setPinVisible(true);
    };

    const handlePinConfirm = async (pin) => {
        setPinVisible(false);
        const pending = pendingSubmitRef.current;
        if (!pending) return;

        setSending(true);
        try {
            await checkPin(pin);
        } catch {
            Alert.alert('Буруу PIN', 'PIN буруу байна');
            setSending(false);
            return;
        }

        try {
            if (pending.type === 'multi') {
                const {phones, amount, description} = pending.data;
                const results = [];
                for (const phone of phones) {
                    const key = createIdempotencyKey('invoice-send');
                    try {
                        await sendInvoice(
                            {receiverPhone: phone, amount, currency, description, receiverAccountId: selectedAccountId},
                            key
                        );
                        results.push({phone, ok: true});
                    } catch (e) {
                        results.push({phone, ok: false, msg: e.response?.data?.message});
                    }
                }
                const failed = results.filter((r) => !r.ok);
                if (failed.length === 0) {
                    Alert.alert('Амжилттай', `${phones.length} хүнд нэхэмжлэл илгээгдлээ`, [{text: 'OK', onPress: onSuccess}]);
                } else {
                    Alert.alert('Хэсэгчлэн амжилттай', `${results.length - failed.length}/${results.length} нэхэмжлэл илгээгдлээ`, [{text: 'OK', onPress: onSuccess}]);
                }
            } else {
                const {totalAmount, phones, peopleCount, description} = pending.data;
                if (!splitInvoiceKeyRef.current) {
                    splitInvoiceKeyRef.current = createIdempotencyKey('invoice-split');
                }
                await sendSplitInvoice(
                    {phones, participantCount: peopleCount, totalAmount, currency, description, receiverAccountId: selectedAccountId},
                    splitInvoiceKeyRef.current
                );
                splitInvoiceKeyRef.current = null;
                Alert.alert('Амжилттай', `${phones.length} хүнд нэхэмжлэл илгээгдлээ`, [{text: 'OK', onPress: onSuccess}]);
            }
        } catch (error) {
            Alert.alert('Алдаа', error.response?.data?.message || 'Илгээж чадсангүй');
        } finally {
            setSending(false);
            pendingSubmitRef.current = null;
        }
    };

    const handlePinClose = () => {
        setPinVisible(false);
        pendingSubmitRef.current = null;
    };

    return {
        myAccounts, selectedAccountId, setSelectedAccountId, loadingAccounts, sending,
        // Non-split recipient management
        recipients, addRecipient, removeRecipient,
        phoneInput, setPhoneInput, lookupUser, lookupLoading,
        currentUserPhone,
        // Handlers
        handleSubmit, handleSplitSubmit,
        pinVisible, handlePinConfirm, handlePinClose,
    };
};
