import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {getAccount, deposit, withdraw, getTransactions} from '../../../services/accountApi';

export const useAccountDetail = (accountId) => {
    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [modal, setModal] = useState(null);
    const [amount, setAmount] = useState('');
    const [txLoading, setTxLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [accountResponse, transactionsResponse] = await Promise.all([
                getAccount(accountId),
                getTransactions(accountId),
            ]);
            setAccount(accountResponse.data);
            setTransactions(transactionsResponse.data);
            setFetched(true);
        } catch {
            Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    const openModal = (type) => {
        setAmount('');
        setModal(type);
    };

    const handleTransaction = async () => {
        const parsed = parseFloat(amount);
        if (!amount || isNaN(parsed) || parsed <= 0) {
            Alert.alert('Алдаа', '0-ээс их дүн оруулна уу');
            return;
        }
        setTxLoading(true);
        try {
            if (modal === 'deposit') await deposit(accountId, parsed);
            else await withdraw(accountId, parsed);
            setModal(null);
            setAmount('');
            await load();
        } catch (error) {
            Alert.alert('Алдаа', error.response?.data?.message || 'Гүйлгээ амжилтгүй');
        } finally {
            setTxLoading(false);
        }
    };

    return {
        account, transactions, loading, fetched, load,
        modal, setModal, amount, setAmount, txLoading,
        openModal, handleTransaction,
    };
};
