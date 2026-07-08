import {useState} from 'react';
import {ScrollView, StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {CURRENCY_BG, CURRENCY_SIGN, CURRENCY_FALLBACK_BG, COLORS} from '../constants';
import {PhoneIcon} from '../components/icons';
import {useCreateInvoice} from '../hooks/useCreateInvoice';

export default function CreateInvoiceScreen({onBack, onSuccess, currency = 'MNT', initialAmount = ''}) {
    const {myAccounts, selectedAccountId, setSelectedAccountId, loadingAccounts, sending, handleSubmit} =
        useCreateInvoice({currency, initialAmount, onSuccess});

    const [receiverPhone, setReceiverPhone] = useState('');
    const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
    const [description, setDescription] = useState('');

    const currencySign = CURRENCY_SIGN[currency] ?? currency;
    const displayAmount = initialAmount > 0 ? Number(initialAmount).toLocaleString() : (amount || '0');

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                        <Text style={styles.backArrow}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {displayAmount} {currencySign} нэхэмжлэх
                    </Text>
                    <View style={{width: 32}}/>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <View style={styles.inputCard}>
                    <PhoneIcon size={24} color={COLORS.muted}/>
                    <TextInput
                        style={styles.phoneInput}
                        placeholder="Утасны дугаар оруулах"
                        placeholderTextColor={COLORS.muted}
                        value={receiverPhone}
                        onChangeText={setReceiverPhone}
                        keyboardType="phone-pad"
                    />
                </View>

                {!initialAmount && (
                    <View style={styles.inputCard}>
                        <Text style={styles.amountPrefix}>{currencySign}</Text>
                        <TextInput
                            style={styles.phoneInput}
                            placeholder="0.00"
                            placeholderTextColor={COLORS.muted}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                        />
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Хүлээн авах данс</Text>
                    {loadingAccounts ? (
                        <View style={styles.centerPad}><Spinner color="$blue500"/></View>
                    ) : myAccounts.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>Данс байхгүй байна</Text>
                        </View>
                    ) : (
                        myAccounts.map((acc) => {
                            const active = selectedAccountId === acc.accountId;
                            const sign = CURRENCY_SIGN[acc.currency] ?? acc.currency;
                            return (
                                <TouchableOpacity
                                    key={acc.accountId}
                                    style={[styles.accountRow, active && styles.accountRowActive]}
                                    onPress={() => setSelectedAccountId(acc.accountId)}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        style={[styles.badge, {backgroundColor: CURRENCY_BG[acc.currency] ?? CURRENCY_FALLBACK_BG}]}>
                                        <Text style={styles.badgeText}>{acc.currency}</Text>
                                    </View>
                                    <View style={{flex: 1}}>
                                        <Text style={styles.accNum}>{acc.accountNumber}</Text>
                                        <Text style={styles.accBal}>
                                            {Number(acc.balance).toLocaleString()} {sign}
                                        </Text>
                                    </View>
                                    <View style={[styles.radio, active && styles.radioActive]}>
                                        {active && <View style={styles.radioDot}/>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Тайлбар</Text>
                    <TextInput
                        style={styles.descInput}
                        placeholder="Нэхэмжлэлийн тайлбар (заавал биш)"
                        placeholderTextColor={COLORS.muted}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                    />
                </View>
            </ScrollView>

            <SafeAreaView edges={['bottom']}>
                <TouchableOpacity
                    style={[styles.submitBtn, sending && styles.submitDisabled]}
                    onPress={() => handleSubmit({receiverPhone, amount, description})}
                    disabled={sending}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitText}>
                        {sending ? 'Илгээж байна...' : 'Нэхэмжлэх'}
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#fff'},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    backArrow: {fontSize: 32, color: '#0f172a', lineHeight: 36},
    headerTitle: {fontSize: 17, fontWeight: '700', color: '#0f172a'},
    body: {padding: 20, paddingBottom: 32},
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    amountPrefix: {fontSize: 18, fontWeight: '700', color: '#0f172a', marginRight: 8},
    phoneInput: {flex: 1, fontSize: 16, color: '#0f172a', paddingVertical: 14},
    section: {marginBottom: 20},
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.muted,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    centerPad: {paddingVertical: 24, alignItems: 'center'},
    emptyCard: {backgroundColor: '#f8fafc', borderRadius: 12, padding: 16},
    emptyText: {color: COLORS.muted, fontSize: 14},
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    accountRowActive: {borderColor: COLORS.accent, backgroundColor: COLORS.accentLight},
    badge: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12},
    badgeText: {color: '#fff', fontWeight: '700', fontSize: 11},
    accNum: {fontSize: 12, color: COLORS.muted, marginBottom: 2},
    accBal: {fontSize: 16, fontWeight: '700', color: '#0f172a'},
    radio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: '#cbd5e1',
        alignItems: 'center', justifyContent: 'center',
    },
    radioActive: {borderColor: COLORS.accent},
    radioDot: {width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.accent},
    descInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 14,
        fontSize: 15,
        color: '#0f172a',
        minHeight: 90,
        textAlignVertical: 'top',
    },
    submitBtn: {
        marginHorizontal: 16,
        marginBottom: 12,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
    },
    submitDisabled: {backgroundColor: COLORS.muted},
    submitText: {color: '#fff', fontWeight: '700', fontSize: 17},
});
