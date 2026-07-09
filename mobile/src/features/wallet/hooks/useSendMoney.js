import {useEffect, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {sendInvoice, sendMoney, getExchangeRate} from '../../../services/paymentApi';
import {getMyAccounts} from '../../../services/accountApi';
import {getMe, lookupUserByPhone} from '../../../services/userApi';
import {CURRENCY_SIGN, MIN_PHONE_LOOKUP_LENGTH, PHONE_LOOKUP_DEBOUNCE_MS} from '../../../constants';

export const useSendMoney = ({action, amount, filterCurrency, onSuccess}) => {
    const isSend = action === 'send';

    const [receiverPhone, setReceiverPhone] = useState('');
    const [receiverUser, setReceiverUser] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const lookupTimer = useRef(null);

    const [accounts, setAccounts] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loadingAcc, setLoadingAcc] = useState(isSend);

    const [invoiceCurrency, setInvoiceCurrency] = useState(filterCurrency ?? 'MNT');
    const [myAccounts, setMyAccounts] = useState([]);
    const [receiverAccountId, setReceiverAccountId] = useState(null);
    const [loadingMyAcc, setLoadingMyAcc] = useState(!isSend);

    const [exchangeRate, setExchangeRate] = useState(null);
    const [loadingRate, setLoadingRate] = useState(false);

    const [sending, setSending] = useState(false);

    const selectedAccount = accounts.find((account) => account.accountId === selectedId);
    const needsConversion = isSend && filterCurrency && selectedAccount && selectedAccount.currency !== filterCurrency;
    const currency = isSend
        ? (filterCurrency ?? selectedAccount?.currency ?? 'MNT')
        : invoiceCurrency;

    useEffect(() => {
        if (!needsConversion) {
            setExchangeRate(null);
            return;
        }
        setLoadingRate(true);
        setExchangeRate(null);
        getExchangeRate(filterCurrency, selectedAccount.currency)
            .then((rateResponse) => setExchangeRate(rateResponse.data.rate))
            .catch(() => setExchangeRate(null))
            .finally(() => setLoadingRate(false));
    }, [selectedId]);

    useEffect(() => {
        if (isSend) return;
        (async () => {
            try {
                const userResponse = await getMe();
                const accountsResponse = await getMyAccounts(userResponse.data.userId);
                const invoiceCurr = filterCurrency ?? 'MNT';
                const filtered = accountsResponse.data.filter((account) => account.currency === invoiceCurr);
                setMyAccounts(filtered.length > 0 ? filtered : accountsResponse.data);
                const preferred = filtered[0] ?? accountsResponse.data[0];
                if (preferred) setReceiverAccountId(preferred.accountId);
            } catch {
                Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
            } finally {
                setLoadingMyAcc(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!isSend) return;
        (async () => {
            try {
                const userResponse = await getMe();
                const accountsResponse = await getMyAccounts(userResponse.data.userId);
                setAccounts(accountsResponse.data);
                const preferred = filterCurrency
                    ? (accountsResponse.data.find((account) => account.currency === filterCurrency) ?? accountsResponse.data[0])
                    : accountsResponse.data[0];
                if (preferred) setSelectedId(preferred.accountId);
            } catch {
                Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
            } finally {
                setLoadingAcc(false);
            }
        })();
    }, []);

    useEffect(() => {
        const phone = receiverPhone.trim();
        setReceiverUser(null);
        if (lookupTimer.current) clearTimeout(lookupTimer.current);
        if (phone.length < MIN_PHONE_LOOKUP_LENGTH) return;
        setLookupLoading(true);
        lookupTimer.current = setTimeout(async () => {
            try {
                const lookupResponse = await lookupUserByPhone(phone);
                setReceiverUser(lookupResponse.data);
            } catch {
                setReceiverUser(null);
            } finally {
                setLookupLoading(false);
            }
        }, PHONE_LOOKUP_DEBOUNCE_MS);
        return () => clearTimeout(lookupTimer.current);
    }, [receiverPhone]);

    const doSubmit = async (description) => {
        setSending(true);
        try {
            if (isSend) {
                await sendMoney({receiverPhone, amount, currency, description, senderAccountId: selectedId});
                Alert.alert('Амжилттай', 'Мөнгө амжилттай илгээгдлээ', [{text: 'OK', onPress: onSuccess}]);
            } else {
                await sendInvoice({receiverPhone, amount, currency, description, receiverAccountId});
                Alert.alert('Амжилттай', 'Нэхэмжлэл илгээгдлээ', [{text: 'OK', onPress: onSuccess}]);
            }
        } catch (error) {
            Alert.alert('Алдаа', error.response?.data?.message || 'Амжилтгүй боллоо');
        } finally {
            setSending(false);
        }
    };

    const handleSubmit = (description) => {
        if (!receiverPhone.trim()) return Alert.alert('Алдаа', 'Утасны дугаар оруулна уу');
        if (amount <= 0) return Alert.alert('Алдаа', 'Дүн оруулна уу');
        if (isSend && !selectedId) return Alert.alert('Алдаа', 'Данс сонгоно уу');

        const currencySymbol = CURRENCY_SIGN[currency] ?? currency;
        const amountStr = `${Number(amount).toLocaleString()} ${currencySymbol}`;
        const msg = isSend
            ? `${receiverPhone} дугаарт ${amountStr} илгээх үү?`
            : `${receiverPhone} дугаараас ${amountStr} нэхэмжлэх үү?`;

        Alert.alert('Итгэлтэй байна уу?', msg, [
            {text: 'Үгүй', style: 'cancel'},
            {text: 'Тийм', onPress: () => doSubmit(description)},
        ]);
    };

    return {
        receiverPhone, setReceiverPhone,
        receiverUser, lookupLoading,
        accounts, selectedId, setSelectedId, loadingAcc,
        invoiceCurrency, setInvoiceCurrency,
        myAccounts, receiverAccountId, setReceiverAccountId, loadingMyAcc,
        exchangeRate, loadingRate,
        sending,
        isSend, currency, selectedAccount, needsConversion,
        handleSubmit,
    };
};
