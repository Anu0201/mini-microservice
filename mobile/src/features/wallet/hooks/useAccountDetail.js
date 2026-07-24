import {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert} from 'react-native';
import {deposit, withdraw, getTransactions, getMyAccounts} from '../../../services/accountApi';
import {getMe} from '../../../services/userApi';

export const useAccountDetail = (accountId) => {
    const [accounts, setAccounts] = useState([]);
    const [activeAccountId, setActiveAccountId] = useState(accountId);
    const [transactions, setTransactions] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [transactionsLoading, setTransactionsLoading] = useState(true);
    const [fetched, setFetched] = useState(false);
    const [modal, setModal] = useState(null);
    const [amount, setAmount] = useState('');
    const [txLoading, setTxLoading] = useState(false);

    useEffect(() => {
        setActiveAccountId(accountId);
    }, [accountId]);

    const loadAccounts = useCallback(async () => {
        try {
            const meResponse = await getMe();
            const accountsResponse = await getMyAccounts(meResponse.data.userId);
            setAccounts(accountsResponse.data);
            setActiveAccountId((current) => {
                if (current && accountsResponse.data.some((item) => item.accountId === current)) {
                    return current;
                }
                return accountsResponse.data[0]?.accountId ?? current;
            });
            setFetched(true);
        } catch {
            Alert.alert('Алдаа', 'Дансны жагсаалт татаж чадсангүй');
        } finally {
            setAccountsLoading(false);
        }
    }, []);

    const account = useMemo(
        () => accounts.find((item) => item.accountId === activeAccountId) ?? null,
        [accounts, activeAccountId]
    );

    useEffect(() => {
        if (!activeAccountId) return;
        let cancelled = false;
        setTransactionsLoading(true);
        getTransactions(activeAccountId)
            .then((res) => {
                if (!cancelled) setTransactions(res.data);
            })
            .catch(() => {
                if (!cancelled) Alert.alert('Алдаа', 'Гүйлгээний түүх татаж чадсангүй');
            })
            .finally(() => {
                if (!cancelled) setTransactionsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [activeAccountId]);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

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
            if (modal === 'deposit') await deposit(activeAccountId, parsed);
            else await withdraw(activeAccountId, parsed);
            setModal(null);
            setAmount('');
            await loadAccounts();
            const txResponse = await getTransactions(activeAccountId);
            setTransactions(txResponse.data);
        } catch (error) {
            Alert.alert('Алдаа', error.response?.data?.message || 'Гүйлгээ амжилтгүй');
        } finally {
            setTxLoading(false);
        }
    };

    const activeIndex = useMemo(
        () => accounts.findIndex((item) => item.accountId === activeAccountId),
        [accounts, activeAccountId]
    );

    const goToIndex = useCallback((nextIndex) => {
        if (accounts.length === 0) return false;
        const wrappedIndex = ((nextIndex % accounts.length) + accounts.length) % accounts.length;
        setModal(null);
        setAmount('');
        setActiveAccountId(accounts[wrappedIndex].accountId);
        return true;
    }, [accounts]);

    return {
        account, accounts, activeIndex, goToIndex,
        canGoPrev: accounts.length > 1,
        canGoNext: accounts.length > 1,
        goToPrevAccount: () => goToIndex(activeIndex - 1),
        goToNextAccount: () => goToIndex(activeIndex + 1),
        transactions,
        loading: accountsLoading,
        transactionsLoading,
        fetched,
        modal, setModal, amount, setAmount, txLoading,
        openModal, handleTransaction,
    };
};