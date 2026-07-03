import {StatusBar} from 'expo-status-bar';
import {useState} from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {GluestackUIProvider, Box, Text, HStack, Pressable} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {logout} from './api/authApi';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import InvoiceListScreen from './screens/InvoiceListScreen';
import CreateInvoiceScreen from './screens/CreateInvoiceScreen';
import AccountScreen from './screens/AccountScreen';
import AccountDetailScreen from './screens/AccountDetailScreen';

export default function App() {
    const [screen, setScreen] = useState('login');
    const [user, setUser] = useState(null);
    const [mainTab, setMainTab] = useState('invoices');
    const [invoiceScreen, setInvoiceScreen] = useState('list');
    const [selectedAccount, setSelectedAccount] = useState(null);

    const handleLogout = async () => {
        await logout();
        setUser(null);
        setScreen('login');
        setMainTab('invoices');
        setInvoiceScreen('list');
        setSelectedAccount(null);
    };

    const switchTab = (tab) => {
        setMainTab(tab);
        setInvoiceScreen('list');
        setSelectedAccount(null);
    };

    const isSubScreen = invoiceScreen === 'create' || !!selectedAccount;

    const renderContent = () => {
        if (!user) {
            if (screen === 'login') {
                return (
                    <LoginScreen
                        onLoginSuccess={(data) => {
                            setUser(data);
                            setScreen('home');
                        }}
                        onGoRegister={() => setScreen('register')}
                    />
                );
            }
            return <RegisterScreen onGoLogin={() => setScreen('login')}/>;
        }

        if (mainTab === 'invoices') {
            if (invoiceScreen === 'create') {
                return (
                    <CreateInvoiceScreen
                        userId={user.id}
                        onBack={() => setInvoiceScreen('list')}
                        onSuccess={() => setInvoiceScreen('list')}
                    />
                );
            }
            return <InvoiceListScreen onCompose={() => setInvoiceScreen('create')}/>;
        }

        if (mainTab === 'accounts') {
            if (selectedAccount) {
                return (
                    <AccountDetailScreen
                        accountId={selectedAccount.accountId}
                        onBack={() => setSelectedAccount(null)}
                    />
                );
            }
            return (
                <AccountScreen
                    onSelectAccount={(account) => setSelectedAccount(account)}
                />
            );
        }

        return null;
    };

    return (
        <SafeAreaProvider>
            <GluestackUIProvider config={config}>
                <Box flex={1} style={{backgroundColor: '#f9fafb'}}>
                    {user && !isSubScreen && (
                        <SafeAreaView edges={['top']} style={{backgroundColor: '#fff'}}>
                            <Box style={styles.appHeader}>
                                <Text style={styles.appHeaderTitle}>
                                    Сайн байна уу, {user.username}
                                </Text>
                                <TouchableOpacity onPress={handleLogout}>
                                    <Text style={styles.logoutText}>Гарах</Text>
                                </TouchableOpacity>
                            </Box>
                        </SafeAreaView>
                    )}

                    <Box flex={1}>{renderContent()}</Box>

                    {user && !isSubScreen && (
                        <SafeAreaView edges={['bottom']} style={{backgroundColor: '#fff'}}>
                            <HStack style={styles.tabBar}>
                                <Pressable
                                    flex={1}
                                    alignItems="center"
                                    py="$2"
                                    borderTopWidth={2}
                                    borderColor={mainTab === 'invoices' ? '$blue600' : '$transparent'}
                                    onPress={() => switchTab('invoices')}
                                >
                                    <Text
                                        size="xs"
                                        fontWeight={mainTab === 'invoices' ? '$semibold' : '$normal'}
                                        color={mainTab === 'invoices' ? '$blue600' : '$gray400'}
                                    >
                                        Нэхэмжлэл
                                    </Text>
                                </Pressable>
                                <Pressable
                                    flex={1}
                                    alignItems="center"
                                    py="$2"
                                    borderTopWidth={2}
                                    borderColor={mainTab === 'accounts' ? '$blue600' : '$transparent'}
                                    onPress={() => switchTab('accounts')}
                                >
                                    <Text
                                        size="xs"
                                        fontWeight={mainTab === 'accounts' ? '$semibold' : '$normal'}
                                        color={mainTab === 'accounts' ? '$blue600' : '$gray400'}
                                    >
                                        Данс
                                    </Text>
                                </Pressable>
                            </HStack>
                        </SafeAreaView>
                    )}
                </Box>
                <StatusBar style="auto"/>
            </GluestackUIProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    appHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
    },
    appHeaderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600',
    },
    tabBar: {
        borderTopWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    tabIcon: {
        fontSize: 20,
        marginBottom: 2,
    },
});