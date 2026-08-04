import {useCallback, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {cancelMyInvoice, getMyInvoices, getSentInvoices, payInvoice} from '../../../services/paymentApi';
import {getMyAccounts} from '../../../services/accountApi';
import {getMe} from '../../../services/userApi';

export const useInvoiceList = () => {
    const [received, setReceived] = useState([]);
    const [sent, setSent] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const [payModalVisible, setPayModalVisible] = useState(false);
    const [payingId, setPayingId] = useState(null);
    const [payAccounts, setPayAccounts] = useState([]);
    const [loadingAcc, setLoadingAcc] = useState(false);
    const [pinVisible, setPinVisible] = useState(false);
    const pendingAccountIdRef = useRef(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [rcv, snt] = await Promise.all([getMyInvoices(), getSentInvoices()]);
            setReceived(rcv.data);
            setSent(snt.data);
            setFetched(true);
        } catch {
            Alert.alert('Алдаа', 'Мэдээлэл татаж чадсангүй');
        } finally {
            setLoading(false);
        }
    }, []);

    const handlePay = async (invoiceId) => {
        setPayingId(invoiceId);
        setPayAccounts([]);
        setPayModalVisible(true);
        setLoadingAcc(true);
        try {
            const userRes = await getMe();
            const accRes = await getMyAccounts(userRes.data.userId);
            setPayAccounts(accRes.data);
        } catch {
            Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
            setPayModalVisible(false);
        } finally {
            setLoadingAcc(false);
        }
    };

    const executePay = (accountId) => {
        pendingAccountIdRef.current = accountId;
        setPayModalVisible(false);
        setPinVisible(true);
    };

    const handlePinConfirm = async (pin) => {
        setPinVisible(false);
        try {
            await payInvoice(payingId, pendingAccountIdRef.current, pin);
            setPayingId(null);
            load();
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || 'Төлөлт амжилтгүй');
        }
    };

    const handlePinClose = () => {
        setPinVisible(false);
        setPayModalVisible(true);
    };

    const handleCancel = (id) => {
        Alert.alert('Цуцлах', 'Нэхэмжлэлийг цуцлах уу?', [
            {text: 'Үгүй'},
            {
                text: 'Тийм', style: 'destructive', onPress: async () => {
                    try {
                        await cancelMyInvoice(id);
                        load();
                    } catch (e) {
                        Alert.alert('Алдаа', e.response?.data?.message || 'Цуцлах амжилтгүй');
                    }
                },
            },
        ]);
    };

    const pendingInvoices = received.filter((i) => i.status === 'UNPAID');

    const transactions = [
        ...sent
            .map((i) => ({...i, _isSent: true, _isDeclined: i.status === 'CANCELLED'})),
        ...received
            .filter((i) => i.status !== 'UNPAID')
            .map((i) => ({...i, _isSent: false, _isDeclined: i.status === 'CANCELLED'})),
    ].sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
    });

    return {
        loading, fetched, load,
        pendingInvoices, transactions,
        payModalVisible, payAccounts, loadingAcc,
        handlePay, executePay, handleCancel,
        closePayModal: () => {
            setPayModalVisible(false);
            setPayingId(null);
        },
        pinVisible, handlePinConfirm, handlePinClose,
    };
};
