import {StatusBar} from 'expo-status-bar';
import {useState} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {GluestackUIProvider, Text} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import Svg, {Path, G} from 'react-native-svg';
let LiquidGlassView = null;
let isLiquidGlassSupported = false;
try {
    const liquidGlass = require('@callstack/liquid-glass');
    LiquidGlassView = liquidGlass.LiquidGlassView;
    isLiquidGlassSupported = liquidGlass.isLiquidGlassSupported;
} catch (_) {}
import {logout} from './api/authApi';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import InvoiceListScreen from './screens/InvoiceListScreen';
import AccountScreen from './screens/AccountScreen';
import AccountDetailScreen from './screens/AccountDetailScreen';
import SendMoneyScreen from './screens/SendMoneyScreen';
import CreateInvoiceScreen from './screens/CreateInvoiceScreen';

const GLASS = isLiquidGlassSupported;
const TAB_CONTENT_H = 64;

function MoneyIcon({size = 24, color = '#94a3b8'}) {
    return (
        <Svg width={size} height={size} viewBox="-0.5 0 25 25">
            <Path
                d="M18 3.91992H6C3.79086 3.91992 2 5.71078 2 7.91992V17.9199C2 20.1291 3.79086 21.9199 6 21.9199H18C20.2091 21.9199 22 20.1291 22 17.9199V7.91992C22 5.71078 20.2091 3.91992 18 3.91992Z"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <Path
                d="M2 9.96997H5.37006C6.16571 9.96997 6.92872 10.286 7.49133 10.8486C8.05394 11.4112 8.37006 12.1743 8.37006 12.97C8.37006 13.7656 8.05394 14.5287 7.49133 15.0913C6.92872 15.6539 6.16571 15.97 5.37006 15.97H2"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </Svg>
    );
}

function MenuIcon({size = 24, color = '#94a3b8'}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M4 6H20M4 12H20M4 18H20"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function ProfileIcon({size = 24, color = '#94a3b8'}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
            <G transform="translate(-140 -2159)">
                <G transform="translate(56 160)" fill={color} fillRule="evenodd">
                    <Path
                        d="M100.562548,2016.99998 L87.4381713,2016.99998 C86.7317804,2016.99998 86.2101535,2016.30298 86.4765813,2015.66198 C87.7127655,2012.69798 90.6169306,2010.99998 93.9998492,2010.99998 C97.3837885,2010.99998 100.287954,2012.69798 101.524138,2015.66198 C101.790566,2016.30298 101.268939,2016.99998 100.562548,2016.99998 M89.9166645,2004.99998 C89.9166645,2002.79398 91.7489936,2000.99998 93.9998492,2000.99998 C96.2517256,2000.99998 98.0830339,2002.79398 98.0830339,2004.99998 C98.0830339,2007.20598 96.2517256,2008.99998 93.9998492,2008.99998 C91.7489936,2008.99998 89.9166645,2007.20598 89.9166645,2004.99998 M103.955674,2016.63598 C103.213556,2013.27698 100.892265,2010.79798 97.837022,2009.67298 C99.4560048,2008.39598 100.400241,2006.33098 100.053171,2004.06998 C99.6509769,2001.44698 97.4235996,1999.34798 94.7348224,1999.04198 C91.0232075,1998.61898 87.8750721,2001.44898 87.8750721,2004.99998 C87.8750721,2006.88998 88.7692896,2008.57398 90.1636971,2009.67298 C87.1074334,2010.79798 84.7871636,2013.27698 84.044024,2016.63598 C83.7745338,2017.85698 84.7789973,2018.99998 86.0539717,2018.99998 L101.945727,2018.99998 C103.221722,2018.99998 104.226185,2017.85698 103.955674,2016.63598"/>
                </G>
            </G>
        </Svg>
    );
}

function AppContent() {
    const [screen, setScreen] = useState('login');
    const [user, setUser] = useState(null);
    const [mainTab, setMainTab] = useState('home');
    const [actionScreen, setActionScreen] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    const insets = useSafeAreaInsets();
    const tabBarH = TAB_CONTENT_H + (insets.bottom > 0 ? insets.bottom : 12);

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

    const isSubScreen = !!actionScreen || !!selectedAccount || showHistory;
    const showTabBar = !!user && !isSubScreen;

    const renderContent = () => {
        if (!user) {
            if (screen === 'login') {
                return (
                    <LoginScreen
                        onLoginSuccess={(data) => {setUser(data); setScreen('home');}}
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
                    onBack={() => setActionScreen(null)}
                    onSuccess={() => {setActionScreen(null); switchTab('home');}}
                />
            );
        }
        if (actionScreen?.action === 'send') {
            return (
                <SendMoneyScreen
                    action="send"
                    amount={actionScreen.amount}
                    currency={actionScreen.currency}
                    onBack={() => setActionScreen(null)}
                    onSuccess={() => {setActionScreen(null); switchTab('home');}}
                />
            );
        }
        if (selectedAccount) {
            return <AccountDetailScreen accountId={selectedAccount.accountId} onBack={() => setSelectedAccount(null)}/>;
        }
        if (mainTab === 'home') {
            return (
                <HomeScreen
                    onSend={(amount, currency) => setActionScreen({action: 'send', amount, currency})}
                    onInvoice={(amount, currency) => setActionScreen({action: 'invoice', amount, currency})}
                    onHistory={() => setShowHistory(true)}
                />
            );
        }
        if (mainTab === 'history') return <View style={{flex: 1, backgroundColor: '#f8fafc'}}/>;
        if (mainTab === 'profile') {
            return <AccountScreen onSelectAccount={(account) => setSelectedAccount(account)} onLogout={handleLogout}/>;
        }
        return null;
    };

    const iconColor = (tab) => {
        const active = mainTab === tab;
        if (GLASS) return active ? '#B771E5' : 'rgba(255,255,255,0.75)';
        return active ? '#B771E5' : '#94a3b8';
    };

    const tabItems = (
        <>
            <TouchableOpacity style={styles.tabItem} onPress={() => switchTab('profile')} activeOpacity={0.7}>
                <ProfileIcon size={24} color={iconColor('profile')}/>
                <Text style={[styles.tabLabel, mainTab === 'profile' && styles.tabLabelActive, GLASS && styles.tabLabelGlass]}>
                    Профайл
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => switchTab('home')} activeOpacity={0.7}>
                <MoneyIcon size={28} color={iconColor('home')}/>
                <Text style={[styles.tabLabel, mainTab === 'home' && styles.tabLabelActive, GLASS && styles.tabLabelGlass]}>
                    Нүүр
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => switchTab('history')} activeOpacity={0.7}>
                <MenuIcon size={28} color={iconColor('history')}/>
                <Text style={[styles.tabLabel, mainTab === 'history' && styles.tabLabelActive, GLASS && styles.tabLabelGlass]}>
                    Цэс
                </Text>
            </TouchableOpacity>
        </>
    );

    return (
        <View style={styles.root}>
            <View style={[styles.content, GLASS && showTabBar && {paddingBottom: tabBarH}]}>
                {renderContent()}
            </View>

            {showTabBar && (
                GLASS ? (
                    <View style={[styles.tabBarFloat, {height: tabBarH}]}>
                        <LiquidGlassView
                            style={[styles.glassBar, {paddingBottom: insets.bottom > 0 ? insets.bottom : 12}]}
                            effect="regular"
                            colorScheme="system"
                        >
                            <View style={styles.tabRow}>{tabItems}</View>
                        </LiquidGlassView>
                    </View>
                ) : (
                    <SafeAreaView edges={['bottom']} style={styles.tabBarWrapper}>
                        <View style={styles.tabBar}>{tabItems}</View>
                    </SafeAreaView>
                )
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

    tabBarFloat: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    glassBar: {
        flex: 1,
        paddingTop: 10,
        paddingHorizontal: 8,
    },
    tabRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: TAB_CONTENT_H - 10,
    },

    tabBarWrapper: {backgroundColor: '#fff'},
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#fff',
        paddingVertical: 8,
    },

    tabItem: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4},
    tabLabel: {fontSize: 11, color: '#94a3b8', marginTop: 2},
    tabLabelActive: {color: '#B771E5', fontWeight: '600'},
    tabLabelGlass: {color: 'rgba(255,255,255,0.75)'},
});
