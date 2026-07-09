import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {createAccount, getMyAccounts} from '../api/accountApi';
import {getMe} from '../api/userApi';

export const useAccount = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [creating, setCreating] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const userRes = await getMe();
            const me = userRes.data;
            const accRes = await getMyAccounts(me.userId);
            setUserInfo(me);
            setAccounts(accRes.data);
            setFetched(true);
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || 'Мэдээлэл татаж чадсангүй');
        } finally {
            setLoading(false);
        }
    }, []);

    const createNewAccount = useCallback((currency) => {
        Alert.alert('Данс нээх', `${currency} данс нээх уу?`, [
            {text: 'Үгүй'},
            {
                text: 'Тийм',
                onPress: async () => {
                    setCreating(true);
                    try {
                        await createAccount(userInfo.userId, currency);
                        await load();
                    } catch (e) {
                        Alert.alert('Алдаа', e.response?.data?.message || 'Данс нээж чадсангүй');
                    } finally {
                        setCreating(false);
                    }
                },
            },
        ]);
    }, [userInfo, load]);

    return {userInfo, accounts, loading, fetched, creating, load, createNewAccount};
};
