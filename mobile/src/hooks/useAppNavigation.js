import {useState} from 'react';
import {logout} from '../features/auth/services/authApi';

export const useAppNavigation = () => {
    const [screen, setScreen] = useState('login');
    const [user, setUser] = useState(null);
    const [mainTab, setMainTab] = useState('home');
    const [actionScreen, setActionScreen] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    const handleLoginSuccess = (data) => {
        setUser(data);
        setScreen('home');
    };

    const handleLogout = async () => {
        await logout();
        setUser(null);
        setScreen('login');
        setMainTab('home');
        setActionScreen(null);
        setSelectedAccount(null);
    };

    const switchTab = (tab) => {
        setMainTab(tab);
        setActionScreen(null);
        setSelectedAccount(null);
        setShowHistory(false);
    };

    const openSend = (amount, currency) => setActionScreen({action: 'send', amount, currency});
    const openInvoice = (amount, currency) => setActionScreen({action: 'invoice', amount, currency});
    const closeAction = () => setActionScreen(null);

    const isSubScreen = !!actionScreen || showHistory;
    const showTabBar = !!user && !isSubScreen;

    return {
        screen, setScreen,
        user, mainTab,
        actionScreen, selectedAccount, setSelectedAccount,
        showHistory, setShowHistory,
        handleLoginSuccess, handleLogout,
        switchTab, openSend, openInvoice, closeAction,
        isSubScreen, showTabBar,
    };
};
