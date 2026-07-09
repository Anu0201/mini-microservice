import {StatusBar} from 'expo-status-bar';
import {StyleSheet, View} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {GluestackUIProvider} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';

import {useAppNavigation} from './src/hooks/useAppNavigation';
import TabBar from './src/components/TabBar';
import {TAB_CONTENT_HEIGHT, TAB_BAR_FALLBACK_PADDING} from './src/constants';

import LoginScreen from './src/features/auth/screens/LoginScreen';
import RegisterScreen from './src/features/auth/screens/RegisterScreen';
import HomeScreen from './src/features/wallet/screens/HomeScreen';
import InvoiceListScreen from './src/features/invoice/screens/InvoiceListScreen';
import AccountScreen from './src/features/wallet/screens/AccountScreen';
import AccountDetailScreen from './src/features/wallet/screens/AccountDetailScreen';
import SendMoneyScreen from './src/features/wallet/screens/SendMoneyScreen';
import CreateInvoiceScreen from './src/features/invoice/screens/CreateInvoiceScreen';

let LiquidGlassView = null;
let isLiquidGlassSupported = false;
try {
    const liquidGlassModule = require('@callstack/liquid-glass');
    LiquidGlassView = liquidGlassModule.LiquidGlassView;
    isLiquidGlassSupported = liquidGlassModule.isLiquidGlassSupported;
} catch (_) {}

const GLASS = isLiquidGlassSupported;

function AppContent() {
    const insets = useSafeAreaInsets();
    const tabBarH = TAB_CONTENT_HEIGHT + (insets.bottom > 0 ? insets.bottom : TAB_BAR_FALLBACK_PADDING);

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
            <View style={[styles.content, showTabBar && {paddingBottom: tabBarH}]}>
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
