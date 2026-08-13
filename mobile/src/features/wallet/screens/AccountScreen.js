import {useEffect, useRef, useState} from 'react';
import {Alert, Animated, Easing, Image, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {Spinner, Text} from '@gluestack-ui/themed';
import {EditIcon} from '../../../components/icons';
import {CURRENCY_SIGN, COLORS, CURRENCIES, getCurrencyBg} from '../../../constants';
import {isPrefixCurrency} from '../../../utils/helpers';
import {useAccount} from '../hooks/useAccount';
import {useLanguage} from '../../../context/LanguageContext';
import {useTheme} from '../../../context/ThemeContext';
import {uploadProfileImage} from '../../../services/userApi';

function AccountCard({account, onPress, t, colors}) {
    const color = getCurrencyBg(account.currency, colors);
    const currencySymbol = CURRENCY_SIGN[account.currency] ?? account.currency;
    const isPrefix = isPrefixCurrency(account.currency);
    return (
        <TouchableOpacity style={[styles.accountCard, {backgroundColor: colors.surface}]} onPress={() => onPress(account)} activeOpacity={0.8}>
            <View style={styles.accountCardTop}>
                <Text style={[styles.bankLabel, {color: colors.muted}]}>{t('Дансны мэдээлэл', 'Account Info')}</Text>
                <View style={[styles.currencyTag, {backgroundColor: color}]}>
                    <Text style={styles.currencyTagText}>{account.currency}</Text>
                </View>
            </View>
            <Text style={[styles.accountNumber, {color: colors.secondary}]} numberOfLines={1}>{account.accountNumber}</Text>
            <View style={styles.accountCardBottom}>
                <Text style={[styles.balanceAmount, {color: colors.text}]}>
                    {isPrefix
                        ? <><Text style={[styles.balanceCurrency, {color: colors.text}]}>{currencySymbol} </Text>{Number(account.balance).toLocaleString()}</>
                        : <>{Number(account.balance).toLocaleString()} <Text style={[styles.balanceCurrency, {color: colors.text}]}>{currencySymbol}</Text></>
                    }
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default function AccountScreen({onSelectAccount, onLogout}) {
    const {t} = useLanguage();
    const {colors} = useTheme();
    const {userInfo, accounts, loading, fetched, creating, load, createNewAccount} = useAccount();
    const [newCurrency, setNewCurrency] = useState('MNT');
    const [uploading, setUploading] = useState(false);

    const pickAndUpload = async () => {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('Зөвшөөрөл', 'Permission'), t('Зургийн сан ашиглах зөвшөөрөл шаардлагатай', 'Media library permission is required'));
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (result.canceled) return;
        setUploading(true);
        try {
            await uploadProfileImage(result.assets[0].uri);
            await load();
        } catch {
            Alert.alert(t('Алдаа', 'Error'), t('Зураг байршуулахад алдаа гарлаа', 'Failed to upload image'));
        } finally {
            setUploading(false);
        }
    };
    const [currencyTrackWidth, setCurrencyTrackWidth] = useState(0);
    const indicatorX = useRef(new Animated.Value(0)).current;
    const selectedCurrencyIndex = Math.max(0, CURRENCIES.indexOf(newCurrency));
    const indicatorWidth = currencyTrackWidth > 0 ? (currencyTrackWidth - 6) / CURRENCIES.length : 0;

    useEffect(() => {
        if (!indicatorWidth) return;
        Animated.timing(indicatorX, {
            toValue: selectedCurrencyIndex * indicatorWidth,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [indicatorWidth, indicatorX, selectedCurrencyIndex]);

    if (!fetched && !loading) load();

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <View style={[styles.profileHeader, {backgroundColor: colors.primary}]}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.profileHeaderContent}>
                        <TouchableOpacity onPress={pickAndUpload} activeOpacity={0.85} style={styles.avatarWrapper}>
                            <View style={styles.avatarCircle}>
                                {userInfo?.profileImageUrl ? (
                                    <Image source={{uri: userInfo.profileImageUrl}} style={styles.avatarImage}/>
                                ) : (
                                    <Text style={styles.avatarText}>{userInfo?.initials ?? '?'}</Text>
                                )}
                            </View>
                            <View style={styles.avatarEditBadge}>
                                {uploading
                                    ? <Spinner size="small" color="#fff"/>
                                    : <EditIcon size={14} color="#fff"/>
                                }
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.userName}>{userInfo?.username ?? '...'}</Text>
                        {userInfo?.email ? <Text style={styles.userEmail}>{userInfo.email}</Text> : null}
                        {onLogout && (
                            <TouchableOpacity
                                onPress={() =>
                                    Alert.alert(
                                        t('Гарах', 'Logout'),
                                        t('Системээс гарахдаа итгэлтэй байна уу?', 'Are you sure you want to logout?'),
                                        [
                                            {text: t('Болих', 'Cancel'), style: 'cancel'},
                                            {text: t('Гарах', 'Logout'), style: 'destructive', onPress: onLogout},
                                        ]
                                    )
                                }
                                style={styles.logoutBtn}
                            >
                                <Text style={styles.logoutText}>{t('Гарах', 'Logout')}</Text>
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
                        <AccountCard key={account.accountId} account={account} onPress={onSelectAccount} t={t} colors={colors}/>
                    ))}

                    <View style={[styles.newAccountCard, {backgroundColor: colors.surface}]}>
                        <Text style={[styles.newAccountTitle, {color: colors.primary}]}>{t('Шинэ данс нээх', 'Open New Account')}</Text>
                        <View style={styles.currencyRow}>
                            <View
                                style={[styles.currencyTrack, {backgroundColor: colors.card}]}
                                onLayout={(event) => setCurrencyTrackWidth(event.nativeEvent.layout.width)}
                            >
                                {indicatorWidth > 0 && (
                                    <Animated.View
                                        style={[
                                            styles.currencyIndicator,
                                            {
                                                width: indicatorWidth,
                                                backgroundColor: colors.primary,
                                                transform: [{translateX: indicatorX}],
                                            },
                                        ]}
                                    />
                                )}
                                {CURRENCIES.map((currencyCode) => {
                                    const active = newCurrency === currencyCode;
                                    return (
                                        <TouchableOpacity
                                            key={currencyCode}
                                            style={styles.currencyBtn}
                                            onPress={() => setNewCurrency(currencyCode)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[styles.currencyBtnText, {color: active ? colors.textOnPrimary : colors.muted}]}>
                                                {currencyCode}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.openBtn, {backgroundColor: colors.primary}, (creating || !userInfo) && {backgroundColor: colors.muted}]}
                            onPress={() => createNewAccount(newCurrency)}
                            disabled={creating || !userInfo}
                        >
                            <Text style={[styles.openBtnText, {color: colors.textOnPrimary}]}>{creating ? t('Нээж байна...', 'Opening...') : t('Данс нээх', 'Open Account')}</Text>
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
        backgroundColor: COLORS.primary,
        paddingBottom: 28,
    },
    profileHeaderContent: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 8,
        paddingHorizontal: 20,
    },
    avatarWrapper: {marginBottom: 12, position: 'relative'},
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        overflow: 'hidden',
    },
    avatarImage: {width: 80, height: 80, borderRadius: 40},
    avatarText: {color: '#fff', fontSize: 28, fontWeight: '700'},
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEditIcon: {},
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
    newAccountTitle: {fontSize: 15, fontWeight: '600', color: COLORS.primary, marginBottom: 14},
    currencyRow: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    currencyTrack: {
        flexDirection: 'row',
        width: '100%',
        maxWidth: 370,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
        padding: 3,
        position: 'relative',
    },
    currencyIndicator: {
        position: 'absolute',
        left: 3,
        top: 3,
        bottom: 3,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
    },
    currencyBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    currencyBtnText: {fontSize: 13, fontWeight: '600', color: COLORS.secondary},
    currencyBtnTextActive: {color: '#fff'},
    openBtn: {backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center'},
    openBtnDisabled: {backgroundColor: '#cbd5e1'},
    openBtnText: {color: '#fff', fontWeight: '700', fontSize: 15},
});
