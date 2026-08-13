import {useEffect, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {sendMoney, getExchangeRate} from '../../../services/paymentApi';
import {getMyAccounts} from '../../../services/accountApi';
import {getMe, lookupUserByPhone} from '../../../services/userApi';
import {CURRENCY_SIGN, MIN_PHONE_LOOKUP_LENGTH, PHONE_LOOKUP_DEBOUNCE_MS} from '../../../constants';

const normalizePhone = (phone) => String(phone ?? '').replace(/\D/g, '');

export const useSendMoney = ({action, amount, filterCurrency, onSuccess}) => {
    const isSend = action === 'send';

    // Multi-recipient state
    const [recipients, setRecipients] = useState([]); // [{phone, user}]
    const [phoneInput, setPhoneInput] = useState('');
    const [lookupUser, setLookupUser] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [currentUserPhone, setCurrentUserPhone] = useState('');
    const lookupTimer = useRef(null);

    const [accounts, setAccounts] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loadingAcc, setLoadingAcc] = useState(isSend);

    const [myAccounts, setMyAccounts] = useState([]);
    const [receiverAccountId, setReceiverAccountId] = useState(null);
    const [loadingMyAcc, setLoadingMyAcc] = useState(!isSend);

    const [exchangeRate, setExchangeRate] = useState(null);
    const [loadingRate, setLoadingRate] = useState(false);

    const [sending, setSending] = useState(false);
    const [pinVisible, setPinVisible] = useState(false);
    const pendingDescRef = useRef(null);

    const selectedAccount = accounts.find((a) => a.accountId === selectedId);
    const needsConversion = isSend && filterCurrency && selectedAccount && selectedAccount.currency !== filterCurrency;
    const currency = isSend
        ? (filterCurrency ?? selectedAccount?.currency ?? 'MNT')
        : 'MNT';

    useEffect(() => {
        if (!needsConversion) { setExchangeRate(null); return; }
        setLoadingRate(true);
        setExchangeRate(null);
        getExchangeRate(filterCurrency, selectedAccount.currency)
            .then((r) => setExchangeRate(r.data.rate))
            .catch(() => setExchangeRate(null))
            .finally(() => setLoadingRate(false));
    }, [selectedId]);

    useEffect(() => {
        if (!isSend) return;
        (async () => {
            try {
                const userRes = await getMe();
                setCurrentUserPhone(userRes.data.phoneNumber ?? '');
                const accRes = await getMyAccounts(userRes.data.userId);
                setAccounts(accRes.data);
                const preferred = filterCurrency
                    ? (accRes.data.find((a) => a.currency === filterCurrency) ?? accRes.data[0])
                    : accRes.data[0];
                if (preferred) setSelectedId(preferred.accountId);
            } catch {
                Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
            } finally {
                setLoadingAcc(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (isSend) return;
        (async () => {
            try {
                const userRes = await getMe();
                setCurrentUserPhone(userRes.data.phoneNumber ?? '');
                const accRes = await getMyAccounts(userRes.data.userId);
                setMyAccounts(accRes.data);
                if (accRes.data[0]) setReceiverAccountId(accRes.data[0].accountId);
            } catch {
                Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
            } finally {
                setLoadingMyAcc(false);
            }
        })();
    }, []);

    // Phone lookup with debounce
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

    const handleSubmit = (description) => {
        if (recipients.length === 0) return Alert.alert('Алдаа', 'Хүлээн авагч нэмнэ үү');
        if (amount <= 0) return Alert.alert('Алдаа', 'Дүн оруулна уу');
        if (isSend && !selectedId) return Alert.alert('Алдаа', 'Данс сонгоно уу');
        pendingDescRef.current = description;
        setPinVisible(true);
    };

    const handlePinConfirm = async (pin) => {
        setPinVisible(false);
        setSending(true);
        const results = [];
        for (const {phone} of recipients) {
            try {
                await sendMoney(
                    {receiverPhone: phone, amount, currency, description: pendingDescRef.current, senderAccountId: selectedId},
                    pin
                );
                results.push({phone, ok: true});
            } catch (e) {
                results.push({phone, ok: false, msg: e.response?.data?.message || 'Амжилтгүй'});
            }
        }
        setSending(false);
        const failed = results.filter((r) => !r.ok);
        const currencySign = CURRENCY_SIGN[currency] ?? currency;
        if (failed.length === 0) {
            const total = recipients.length;
            Alert.alert(
                'Амжилттай',
                `${total} хүнд ${Number(amount).toLocaleString()} ${currencySign} илгээгдлээ`,
                [{text: 'OK', onPress: onSuccess}]
            );
        } else if (failed.length === results.length) {
            Alert.alert('Алдаа', failed[0].msg);
        } else {
            Alert.alert(
                'Хэсэгчлэн амжилттай',
                `${results.length - failed.length}/${results.length} амжилттай илгээгдлээ`,
                [{text: 'OK', onPress: onSuccess}]
            );
        }
    };

    const handlePinClose = () => setPinVisible(false);

    return {
        phoneInput, setPhoneInput,
        lookupUser, lookupLoading,
        currentUserPhone,
        recipients, addRecipient, removeRecipient,
        accounts, selectedId, setSelectedId, loadingAcc,
        myAccounts, receiverAccountId, setReceiverAccountId, loadingMyAcc,
        exchangeRate, loadingRate,
        sending,
        isSend, currency, selectedAccount, needsConversion,
        handleSubmit,
        pinVisible, handlePinConfirm, handlePinClose,
    };
};
