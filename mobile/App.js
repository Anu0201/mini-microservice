import {StatusBar} from 'expo-status-bar';
import {StyleSheet, View} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';

import {useAppNavigation} from './hooks/useAppNavigation';
import TabBar from './components/TabBar';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import InvoiceListScreen from './screens/InvoiceListScreen';
import AccountScreen from './screens/AccountScreen';
import AccountDetailScreen from './screens/AccountDetailScreen';
import SendMoneyScreen from './screens/SendMoneyScreen';
import CreateInvoiceScreen from './screens/CreateInvoiceScreen';

let LiquidGlassView = null;
let isLiquidGlassSupported = false;
try {
    const lg = require('@callstack/liquid-glass');
    LiquidGlassView = lg.LiquidGlassView;
    isLiquidGlassSupported = lg.isLiquidGlassSupported;
} catch (_) {}

const GLASS = isLiquidGlassSupported;

function AppContent() {
    const insets = useSafeAreaInsets();
    const tabBarH = 64 + (insets.bottom > 0 ? insets.bottom : 12);

    const {
        screen, setScreen,
        user, mainTab,
        actionScreen, selectedAccount, setSelectedAccount,
        showHistory, setShowHistory,
        handleLoginSuccess, handleLogout,
        switchTab, openSend, openInvoice, closeAction,
        showTabBar,
    } = useAppNavigation();

    const renderContent = () => {
        if (!user) {
            if (screen === 'login') {
                return (
                    <LoginScreen
                        onLoginSuccess={handleLoginSuccess}
                        onGoRegister={() => setScreen('register')}
                    />
                );
            }
            return <RegisterScreen onGoLogin={() => setScreen('login')}/>;
        }

        if (showHistory) return <InvoiceListScreen onBack={() => setShowHistory(false)}/>;

        if (actionScreen?.action === 'invoice') {
            return (
                <CreateInvoiceScreen
                    currency={actionScreen.currency}
                    initialAmount={actionScreen.amount}
                    onBack={closeAction}
                    onSuccess={() => { closeAction(); switchTab('home'); }}
                />
            );
        }

        if (actionScreen?.action === 'send') {
            return (
                <SendMoneyScreen
                    action="send"
                    amount={actionScreen.amount}
                    currency={actionScreen.currency}
                    onBack={closeAction}
                    onSuccess={() => { closeAction(); switchTab('home'); }}
                />
            );
        }

        if (selectedAccount) {
            return <AccountDetailScreen accountId={selectedAccount.accountId} onBack={() => setSelectedAccount(null)}/>;
        }

        if (mainTab === 'home') {
            return (
                <HomeScreen
                    onSend={openSend}
                    onInvoice={openInvoice}
                    onHistory={() => setShowHistory(true)}
                />
            );
        }

        if (mainTab === 'profile') {
            return <AccountScreen onSelectAccount={setSelectedAccount} onLogout={handleLogout}/>;
        }

        return <View style={{flex: 1, backgroundColor: '#f8fafc'}}/>;
    };

    return (
        <View style={styles.root}>
            <View style={[styles.content, GLASS && showTabBar && {paddingBottom: tabBarH}]}>
                {renderContent()}
            </View>

            {showTabBar && (
                <TabBar
                    activeTab={mainTab}
                    onSwitch={switchTab}
                    glass={GLASS}
                    liquidGlassView={LiquidGlassView}
                    insets={insets}
                />
            )}
        </View>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <GluestackUIProvider config={config}>
                <AppContent/>
                <StatusBar style="auto"/>
            </GluestackUIProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: '#f8fafc'},
    content: {flex: 1},
});
