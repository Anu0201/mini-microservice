import {useState} from 'react';
import {Alert, StyleSheet, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '@gluestack-ui/themed';
import Svg, {Path} from 'react-native-svg';
import {CURRENCIES, CURRENCY_SIGN, CURRENCY_BG, COLORS} from '../constants';

function ClockIcon({size = 22, color = '#0f172a'}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 7V12L14.5 10.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

const KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['000', '0', '⌫'],
];


export default function HomeScreen({onInvoice, onSend, onHistory}) {
    const [raw, setRaw] = useState('0');
    const [currency, setCurrency] = useState('MNT');
    const press = (key) => {
        setRaw((prev) => {
            if (key === '⌫') return prev.length <= 1 ? '0' : prev.slice(0, -1);
            if (key === '000') return prev === '0' ? '0' : prev + '000';
            if (prev === '0') return key;
            if (prev.length >= 12) return prev;
            return prev + key;
        });
    };

    const validate = () => {
        const hasAmount = Number(raw) > 0;
        const hasCurrency = !!currency;
        if (!hasAmount && !hasCurrency) {
            Alert.alert('Анхааруулга', 'Дүн оруулж, валют сонгоно уу', [{text: 'За'}]);
            return false;
        }
        if (!hasAmount) {
            Alert.alert('Анхааруулга', 'Дүн оруулна уу', [{text: 'За'}]);
            return false;
        }
        if (!hasCurrency) {
            Alert.alert('Анхааруулга', 'Валют сонгоно уу', [{text: 'За'}]);
            return false;
        }
        return true;
    };

    const handleInvoice = () => { if (validate()) onInvoice(Number(raw), currency); };
    const handleSend = () => { if (validate()) onSend(Number(raw), currency); };

    const display = Number(raw).toLocaleString();
    const sign = currency ? CURRENCY_SIGN[currency] : '';

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']}>
                <View style={styles.topBar}>
                    <View style={{flex: 1}}/>
                    <TouchableOpacity style={styles.iconBtn} onPress={onHistory}>
                        <ClockIcon size={22} color="#0284c7"/>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={styles.currencyRow}>
                {CURRENCIES.map((c) => {
                    const active = currency === c;
                    return (
                        <TouchableOpacity
                            key={c}
                            style={[styles.currencyBtn, active && {backgroundColor: CURRENCY_BG[c]}]}
                            onPress={() => setCurrency((prev) => (prev === c ? null : c))}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.currencyText, active && styles.currencyTextActive]}>
                                {CURRENCY_SIGN[c]} {c}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.amountArea}>
                <Text style={styles.amountText}>
                    {sign ? `${sign} ` : ''}{display}
                </Text>
            </View>


<View style={styles.numpad}>
                {KEYS.map((row, ri) => (
                    <View key={ri} style={styles.row}>
                        {row.map((k) => (
                            <TouchableOpacity key={k} style={styles.key} onPress={() => press(k)} activeOpacity={0.6}>
                                <Text style={k === '⌫' ? styles.backKey : styles.keyText}>{k}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.invoiceBtn} onPress={handleInvoice} activeOpacity={0.85}>
                    <Text style={styles.actionText}>Нэхэмжлэх</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.85}>
                    <Text style={styles.actionText}>Илгээх</Text>
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
    iconEmoji: {fontSize: 18},
    currencyRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingBottom: 4,
    },
    currencyBtn: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
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