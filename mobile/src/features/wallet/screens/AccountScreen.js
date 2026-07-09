import {useState} from 'react';
import {Alert, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {CURRENCY_BG, CURRENCY_SIGN, COLORS, CURRENCIES} from '../../../constants';
import {initials, isPrefixCurrency} from '../../../utils/helpers';
import {useAccount} from '../hooks/useAccount';

function AccountCard({account, onPress}) {
    const color = CURRENCY_BG[account.currency] ?? COLORS.secondary;
    const currencySymbol = CURRENCY_SIGN[account.currency] ?? account.currency;
    const isPrefix = isPrefixCurrency(account.currency);
    return (
        <TouchableOpacity style={styles.accountCard} onPress={() => onPress(account)} activeOpacity={0.8}>
            <View style={styles.accountCardTop}>
                <Text style={styles.bankLabel}>Дансны мэдээлэл</Text>
                <View style={[styles.currencyTag, {backgroundColor: color}]}>
                    <Text style={styles.currencyTagText}>{account.currency}</Text>
                </View>
            </View>
            <Text style={styles.accountNumber} numberOfLines={1}>{account.accountNumber}</Text>
            <View style={styles.accountCardBottom}>
                <Text style={styles.balanceAmount}>
                    {isPrefix
                        ? <><Text
                            style={styles.balanceCurrency}>{currencySymbol} </Text>{Number(account.balance).toLocaleString()}</>
                        : <>{Number(account.balance).toLocaleString()} <Text
                            style={styles.balanceCurrency}>{currencySymbol}</Text></>
                    }
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default function AccountScreen({onSelectAccount, onLogout}) {
    const {userInfo, accounts, loading, fetched, creating, load, createNewAccount} = useAccount();
    const [newCurrency, setNewCurrency] = useState('MNT');

    if (!fetched && !loading) load();

    return (
        <View style={styles.container}>
            <View style={styles.profileHeader}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.profileHeaderContent}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initials(userInfo?.username)}</Text>
                        </View>
                        <Text style={styles.userName}>{userInfo?.username ?? '...'}</Text>
                        {userInfo?.email ? <Text style={styles.userEmail}>{userInfo.email}</Text> : null}
                        {onLogout && (
                            <TouchableOpacity
                                onPress={() =>
                                    Alert.alert('Гарах', 'Системээс гарахдаа итгэлтэй байна уу?', [
                                        {text: 'Болих', style: 'cancel'},
                                        {text: 'Гарах', style: 'destructive', onPress: onLogout},
                                    ])
                                }
                                style={styles.logoutBtn}
                            >
                                <Text style={styles.logoutText}>Гарах</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </SafeAreaView>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <Spinner size="large" color="$white"/>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.body}>
                    {accounts.map((account) => (
                        <AccountCard key={account.accountId} account={account} onPress={onSelectAccount}/>
                    ))}

                    <View style={styles.newAccountCard}>
                        <Text style={styles.newAccountTitle}>Шинэ данс нээх</Text>
                        <View style={styles.currencyRow}>
                            {CURRENCIES.map((currencyCode) => (
                                <TouchableOpacity
                                    key={currencyCode}
                                    style={[styles.currencyBtn, newCurrency === currencyCode && styles.currencyBtnActive]}
                                    onPress={() => setNewCurrency(currencyCode)}
                                >
                                    <Text
                                        style={[styles.currencyBtnText, newCurrency === currencyCode && styles.currencyBtnTextActive]}>{currencyCode}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={[styles.openBtn, (creating || !userInfo) && styles.openBtnDisabled]}
                            onPress={() => createNewAccount(newCurrency)}
                            disabled={creating || !userInfo}
                        >
                            <Text style={styles.openBtnText}>{creating ? 'Нээж байна...' : 'Данс нээх'}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f8fafc'},
    profileHeader: {
        backgroundColor: COLORS.accent,
        paddingBottom: 28,
    },
    profileHeaderContent: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 8,
        paddingHorizontal: 20,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarText: {color: '#fff', fontSize: 28, fontWeight: '700'},
    userName: {color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4},
    userEmail: {color: 'rgba(255,255,255,0.75)', fontSize: 13},
    logoutBtn: {
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    logoutText: {color: '#fff', fontSize: 13, fontWeight: '600'},
    center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    body: {padding: 16, paddingBottom: 24},
    accountCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    accountCardTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
    bankLabel: {fontSize: 12, color: COLORS.muted, fontWeight: '500'},
    currencyTag: {paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10},
    currencyTagText: {color: '#fff', fontSize: 11, fontWeight: '700'},
    accountNumber: {fontSize: 14, color: COLORS.secondary, marginBottom: 12, letterSpacing: 1},
    accountCardBottom: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    balanceAmount: {fontSize: 28, fontWeight: '800', color: '#0f172a'},
    balanceCurrency: {fontSize: 20, fontWeight: '600'},
    atmBtn: {backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12},
    atmBtnText: {fontSize: 12, fontWeight: '700', color: COLORS.secondary},
    actionRow: {flexDirection: 'row', gap: 12, marginBottom: 14},
    actionBtn: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    actionBtnIcon: {fontSize: 20, marginBottom: 4},
    actionBtnLabel: {fontSize: 13, fontWeight: '600', color: '#334155'},
    newAccountCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    newAccountTitle: {fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 14},
    currencyRow: {flexDirection: 'row', gap: 10, marginBottom: 14},
    currencyBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff',
    },
    currencyBtnActive: {borderColor: COLORS.accent, backgroundColor: '#f0f9ff'},
    currencyBtnText: {fontSize: 13, fontWeight: '600', color: COLORS.secondary},
    currencyBtnTextActive: {color: COLORS.accent},
    openBtn: {backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center'},
    openBtnDisabled: {backgroundColor: '#cbd5e1'},
    openBtnText: {color: '#fff', fontWeight: '700', fontSize: 15},
});
