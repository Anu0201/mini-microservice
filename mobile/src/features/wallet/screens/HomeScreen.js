import {useEffect, useRef, useState} from 'react';
import {Alert, Animated, Easing, StyleSheet, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '@gluestack-ui/themed';
import {CURRENCIES, CURRENCY_SIGN, COLORS, MAX_AMOUNT_DIGITS} from '../../../constants';
import {ClockIcon} from '../../../components/icons';
import * as Haptics from 'expo-haptics';
import {useInvoiceList} from '../../invoice/hooks/useInvoiceList';
import {getExchangeRate} from '../../../services/paymentApi';
import {useLanguage} from '../../../context/LanguageContext';
import {useTheme} from '../../../context/ThemeContext';

const KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['000', '0', '⌫'],
];

const DAILY_LIMIT = 5_000_000;

export default function HomeScreen({onInvoice, onSend, onHistory}) {
    const {t} = useLanguage();
    const {colors} = useTheme();
    const [rawAmount, setRawAmount] = useState('0');
    const [currency, setCurrency] = useState('MNT');
    const [currencyTrackWidth, setCurrencyTrackWidth] = useState(0);
    const {pendingInvoices, load, hasUnread, markSeen} = useInvoiceList();
    const indicatorX = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const [mntRate, setMntRate] = useState(null);

    useEffect(() => {
        if (currency === 'MNT') {
            setMntRate(null);
            return;
        }
        getExchangeRate(currency, 'MNT')
            .then(res => setMntRate(res.data.rate))
            .catch(() => setMntRate(null));
    }, [currency]);

    const amountLimit = currency === 'MNT' ? DAILY_LIMIT : mntRate ? Math.floor(DAILY_LIMIT / mntRate) : Infinity;

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, {toValue: 12, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: -12, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: 8, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: -8, duration: 50, useNativeDriver: true}),
            Animated.timing(shakeAnim, {toValue: 0, duration: 50, useNativeDriver: true}),
        ]).start();
    };

    const selectedCurrencyIndex = Math.max(0, CURRENCIES.indexOf(currency));
    const indicatorWidth = currencyTrackWidth > 0
        ? (currencyTrackWidth - 6) / CURRENCIES.length
        : 0;

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!indicatorWidth) return;
        Animated.timing(indicatorX, {
            toValue: selectedCurrencyIndex * indicatorWidth,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [indicatorWidth, selectedCurrencyIndex, indicatorX]);

    const press = (key) => {
        if (key === '⌫') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setRawAmount((prev) => {
                if (prev === '0' || prev.length <= 1) {
                    shake();
                    return '0';
                }
                return prev.slice(0, -1);
            });
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRawAmount((prev) => {
            let next;
            if (key === '000') next = prev === '0' ? '0' : prev + '000';
            else if (prev === '0') next = key;
            else if (prev.length >= MAX_AMOUNT_DIGITS) next = prev;
            else next = prev + key;
            if (Number(next) > amountLimit) {
                shake();
                return prev;
            }
            return next;
        });
    };

    const validate = () => {
        const hasAmount = Number(rawAmount) > 0;
        const hasCurrency = !!currency;
        if (!hasAmount && !hasCurrency) {
            Alert.alert(t('Анхааруулга', 'Warning'), t('Дүн оруулж, валют сонгоно уу', 'Please enter amount and select currency'), [{text: t('За', 'OK')}]);
            return false;
        }
        if (!hasAmount) {
            Alert.alert(t('Анхааруулга', 'Warning'), t('Дүн оруулна уу', 'Please enter amount'), [{text: t('За', 'OK')}]);
            return false;
        }
        if (!hasCurrency) {
            Alert.alert(t('Анхааруулга', 'Warning'), t('Валют сонгоно уу', 'Please select currency'), [{text: t('За', 'OK')}]);
            return false;
        }
        return true;
    };

    const handleInvoice = () => {
        if (validate()) onInvoice(Number(rawAmount), currency);
    };
    const handleSend = () => {
        if (validate()) onSend(Number(rawAmount), currency);
    };

    const display = Number(rawAmount).toLocaleString();
    const sign = currency ? CURRENCY_SIGN[currency] : '';
    const pendingCount = pendingInvoices.length;

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <SafeAreaView edges={['top']}>
                <View style={styles.topBar}>
                    <View style={{flex: 1}}/>
                    <TouchableOpacity
                        style={[styles.iconBtn, {backgroundColor: hasUnread ? colors.primaryLight : colors.card}]}
                        onPress={() => {
                            markSeen();
                            onHistory();
                        }}
                    >
                        <ClockIcon size={22} color={hasUnread ? colors.primary : colors.primary}/>
                        {pendingCount > 0 && (
                            <View style={[styles.badge, {backgroundColor: colors.accent}]}>
                                <Text
                                    style={[styles.badgeText, {color: colors.textOnPrimary}]}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

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
                                    transform: [{translateX: indicatorX}],
                                    backgroundColor: colors.primary,
                                },
                            ]}
                        />
                    )}
                    {CURRENCIES.map((currencyCode) => {
                        const active = currency === currencyCode;
                        return (
                            <TouchableOpacity
                                key={currencyCode}
                                style={styles.currencyBtn}
                                onPress={() => setCurrency(currencyCode)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[styles.currencyText, {color: active ? colors.textOnPrimary : colors.muted}]}>
                                    {CURRENCY_SIGN[currencyCode]} {currencyCode}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <Animated.View style={[styles.amountArea, {transform: [{translateX: shakeAnim}]}]}>
                <Text style={[styles.amountText, {color: colors.text}]}>
                    {sign ? `${sign} ` : ''}{display}
                </Text>
            </Animated.View>

            <View style={styles.numpad}>
                {KEYS.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((keyLabel) => (
                            <TouchableOpacity key={keyLabel} style={styles.key} onPress={() => press(keyLabel)}
                                              activeOpacity={0.6}>
                                <Text
                                    style={[keyLabel === '⌫' ? styles.backKey : styles.keyText, {color: colors.text}]}>{keyLabel}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>

            <View style={[styles.actions, {backgroundColor: colors.background}]}>
                <TouchableOpacity style={[styles.invoiceBtn, {backgroundColor: colors.primary}]} onPress={handleInvoice}
                                  activeOpacity={0.85}>
                    <Text style={[styles.actionText, {color: colors.textOnPrimary}]}>{t('Нэхэмжлэх', 'Invoice')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sendBtn, {backgroundColor: colors.accent}]} onPress={handleSend}
                                  activeOpacity={0.85}>
                    <Text style={[styles.actionText, {color: colors.textOnPrimary}]}>{t('Илгээх', 'Send')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#fff'},
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    balanceChip: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    balanceText: {color: '#0284c7', fontWeight: '600', fontSize: 14},
    iconRow: {flexDirection: 'row', gap: 8},
    iconBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#f0f9ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    badgeText: {fontSize: 10, fontWeight: '700'},
    iconBtnActive: {
        backgroundColor: '#fffbeb',
    },
    iconEmoji: {fontSize: 18},
    currencyRow: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 4,
    },
    currencyTrack: {
        flexDirection: 'row',
        width: '84%',
        maxWidth: 360,
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
    currencyText: {fontSize: 13, fontWeight: '600', color: '#64748b'},
    currencyTextActive: {color: '#fff'},
    amountArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    amountText: {fontSize: 60, fontWeight: '800', color: '#0f172a', letterSpacing: -1},
    numpad: {paddingHorizontal: 8, paddingBottom: 4},
    row: {flexDirection: 'row'},
    key: {flex: 1, height: 72, alignItems: 'center', justifyContent: 'center'},
    keyText: {fontSize: 28, fontWeight: '600', color: '#0f172a'},
    backKey: {fontSize: 24, color: '#0f172a'},
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        gap: 10,
    },
    invoiceBtn: {
        flex: 1,
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtn: {
        flex: 1,
        height: 56,
        backgroundColor: COLORS.accent,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {color: '#fff', fontWeight: '700', fontSize: 16},
});