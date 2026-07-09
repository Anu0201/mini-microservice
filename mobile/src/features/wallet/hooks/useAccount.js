import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {createAccount, getMyAccounts} from '../../../services/accountApi';
import {getMe} from '../../../services/userApi';

export const useAccount = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [creating, setCreating] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const userResponse = await getMe();
            const me = userResponse.data;
            const accountsResponse = await getMyAccounts(me.userId);
            setUserInfo(me);
            setAccounts(accountsResponse.data);
            setFetched(true);
        } catch (error) {
            Alert.alert('Алдаа', error.response?.data?.message || 'Мэдээлэл татаж чадсангүй');
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
                    } catch (error) {
                        Alert.alert('Алдаа', error.response?.data?.message || 'Данс нээж чадсангүй');
                    } finally {
                        setCreating(false);
                    }
                },
            },
        ]);
    }, [userInfo, load]);

    return {userInfo, accounts, loading, fetched, creating, load, createNewAccount};
};
