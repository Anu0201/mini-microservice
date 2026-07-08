import {useEffect, useRef, useState} from 'react';
import {Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {sendInvoice, sendMoney, getExchangeRate} from '../api/paymentApi';
import {getMyAccounts} from '../api/accountApi';
import {getMe, lookupUserByPhone} from '../api/userApi';
import {CURRENCY_BG, CURRENCY_SIGN, CURRENCY_FALLBACK_BG, COLORS} from '../constants';
import {initials, maskName} from '../utils/helpers';
import {PhoneIcon} from '../components/icons';

export default function SendMoneyScreen({
                                            action = 'send',
                                            amount = 0,
                                            currency: filterCurrency = null,
                                            onBack,
                                            onSuccess
                                        }) {
    const [receiverPhone, setReceiverPhone] = useState('');
    const [receiverUser, setReceiverUser] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const lookupTimer = useRef(null);
    const [description, setDescription] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loadingAcc, setLoadingAcc] = useState(action === 'send');
    const [sending, setSending] = useState(false);

    const [invoiceCurrency, setInvoiceCurrency] = useState(filterCurrency ?? 'MNT');
    const [exchangeRate, setExchangeRate] = useState(null);
    const [loadingRate, setLoadingRate] = useState(false);
    const [myAccounts, setMyAccounts] = useState([]);
    const [receiverAccountId, setReceiverAccountId] = useState(null);
    const [loadingMyAcc, setLoadingMyAcc] = useState(action === 'invoice');

    const isSend = action === 'send';

    const selectedAccount = accounts.find((a) => a.accountId === selectedId);
    const needsConversion = isSend && filterCurrency && selectedAccount && selectedAccount.currency !== filterCurrency;

    const currency = isSend
        ? (filterCurrency ?? selectedAccount?.currency ?? 'MNT')
        : invoiceCurrency;
    const currencySign = CURRENCY_SIGN[currency] ?? currency;

    useEffect(() => {
        if (!needsConversion) {
            setExchangeRate(null);
            return;
        }
        setLoadingRate(true);
        setExchangeRate(null);
        getExchangeRate(filterCurrency, selectedAccount.currency)
            .then((res) => setExchangeRate(res.data.rate))
            .catch(() => setExchangeRate(null))
            .finally(() => setLoadingRate(false));
    }, [selectedId]);

    useEffect(() => {
        if (isSend) return;
        (async () => {
            try {
                const userRes = await getMe();
                const accRes = await getMyAccounts(userRes.data.userId);
                const invoiceCurr = filterCurrency ?? 'MNT';
                const filtered = accRes.data.filter((a) => a.currency === invoiceCurr);
                setMyAccounts(filtered.length > 0 ? filtered : accRes.data);
                const preferred = filtered[0] ?? accRes.data[0];
                if (preferred) setReceiverAccountId(preferred.accountId);
            } catch {
                Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
            } finally {
                setLoadingMyAcc(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!isSend) return;
        (async () => {
            try {
                const userRes = await getMe();
                const accRes = await getMyAccounts(userRes.data.userId);
                setAccounts(accRes.data);
                const preferred = filterCurrency
                    ? (accRes.data.find((a) => a.currency === filterCurrency) ?? accRes.data[0])
                    : accRes.data[0];
                if (preferred) setSelectedId(preferred.accountId);
            } catch {
                Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
            } finally {
                setLoadingAcc(false);
            }
        })();
    }, []);

    useEffect(() => {
        const phone = receiverPhone.trim();
        setReceiverUser(null);
        if (lookupTimer.current) clearTimeout(lookupTimer.current);
        if (phone.length < 8) return;
        setLookupLoading(true);
        lookupTimer.current = setTimeout(async () => {
            try {
                const res = await lookupUserByPhone(phone);
                setReceiverUser(res.data);
            } catch (e) {
                console.log('[lookup error]', e?.response?.status, e?.response?.data, e?.message);
                setReceiverUser(null);
            } finally {
                setLookupLoading(false);
            }
        }, 600);
        return () => clearTimeout(lookupTimer.current);
    }, [receiverPhone]);

    const doSubmit = async () => {
        setSending(true);
        try {
            if (isSend) {
                await sendMoney({receiverPhone, amount, currency, description, senderAccountId: selectedId});
                Alert.alert('Амжилттай', 'Мөнгө амжилттай илгээгдлээ', [{text: 'OK', onPress: onSuccess}]);
            } else {
                await sendInvoice({receiverPhone, amount, currency, description, receiverAccountId});
                Alert.alert('Амжилттай', 'Нэхэмжлэл илгээгдлээ', [{text: 'OK', onPress: onSuccess}]);
            }
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || 'Амжилтгүй боллоо');
        } finally {
            setSending(false);
        }
    };

    const handleSubmit = () => {
        if (!receiverPhone.trim()) {
            Alert.alert('Алдаа', 'Утасны дугаар оруулна уу');
            return;
        }
        if (amount <= 0) {
            Alert.alert('Алдаа', 'Дүн оруулна уу');
            return;
        }
        if (isSend && !selectedId) {
            Alert.alert('Алдаа', 'Данс сонгоно уу');
            return;
        }
        const sign = CURRENCY_SIGN[currency] ?? currency;
        const amountStr = `${Number(amount).toLocaleString()} ${sign}`;
        const msg = isSend
            ? `${receiverPhone} дугаарт ${amountStr} илгээх үү?`
            : `${receiverPhone} дугаараас ${amountStr} нэхэмжлэх үү?`;
        Alert.alert('Итгэлтэй байна уу?', msg, [
            {text: 'Үгүй', style: 'cancel'},
            {text: 'Тийм', onPress: doSubmit},
        ]);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                        <Text style={styles.backArrow}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {Number(amount).toLocaleString()} {currencySign} {isSend ? 'илгээх' : 'нэхэмжлэх'}
                    </Text>
                    <View style={{width: 32}}/>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                {/* Phone input */}
                <View style={styles.inputCard}>
                    <PhoneIcon size={24} color="#94a3b8"/>
                    <TextInput
                        style={styles.phoneInput}
                        placeholder="Утасны дугаар оруулах"
                        placeholderTextColor="#94a3b8"
                        value={receiverPhone}
                        onChangeText={setReceiverPhone}
                        keyboardType="phone-pad"
                    />
                </View>

                {lookupLoading && (
                    <View style={styles.userCard}>
                        <Spinner size="small" color={COLORS.accent}/>
                    </View>
                )}
                {!lookupLoading && receiverUser && (
                    <View style={styles.userCard}>
                        <View style={styles.userCardLeft}>
                            <Text style={styles.userCardPhone}>{receiverUser.phoneNumber}</Text>
                            <Text style={styles.userCardName}>{maskName(receiverUser.username)}</Text>
                        </View>
                        <View style={styles.userAvatar}>
                            <Text style={styles.userAvatarText}>{initials(receiverUser.username)}</Text>
                        </View>
                    </View>
                )}
                {!lookupLoading && receiverPhone.trim().length >= 8 && !receiverUser && (
                    <View style={[styles.userCard, styles.userCardNotFound]}>
                        <Text style={styles.userCardNotFoundText}>Хэрэглэгч олдсонгүй</Text>
                    </View>
                )}

                {isSend ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Илгээх данс</Text>
                        {loadingAcc ? (
                            <View style={styles.centerPad}><Spinner color="$blue500"/></View>
                        ) : accounts.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>Данс байхгүй байна</Text>
                            </View>
                        ) : (
                            accounts.map((acc) => {
                                const active = selectedId === acc.accountId;
                                const sign = CURRENCY_SIGN[acc.currency] ?? acc.currency;
                                return (
                                    <TouchableOpacity
                                        key={acc.accountId}
                                        style={[styles.accountRow, active && styles.accountRowActive]}
                                        onPress={() => setSelectedId(acc.accountId)}
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
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Хүлээн авах данс</Text>
                        {loadingMyAcc ? (
                            <View style={styles.centerPad}><Spinner color="$blue500"/></View>
                        ) : myAccounts.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>Данс байхгүй байна</Text>
                            </View>
                        ) : (
                            myAccounts.map((acc) => {
                                const active = receiverAccountId === acc.accountId;
                                const sign = CURRENCY_SIGN[acc.currency] ?? acc.currency;
                                return (
                                    <TouchableOpacity
                                        key={acc.accountId}
                                        style={[styles.accountRow, active && styles.accountRowActive]}
                                        onPress={() => setReceiverAccountId(acc.accountId)}
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
                )}


                {needsConversion && (
                    <View style={styles.conversionCard}>
                        {loadingRate ? (
                            <Text style={styles.conversionText}>Ханш татаж байна...</Text>
                        ) : exchangeRate ? (
                            <>
                                <Text style={styles.conversionText}>
                                    1 {filterCurrency} = {CURRENCY_SIGN[selectedAccount.currency]}{Number(exchangeRate).toLocaleString(undefined, {maximumFractionDigits: 4})} {selectedAccount.currency}
                                </Text>
                                <Text style={[styles.conversionText, {marginTop: 4, fontWeight: '700'}]}>
                                    {CURRENCY_SIGN[filterCurrency]}{Number(amount).toLocaleString()} {filterCurrency} → {CURRENCY_SIGN[selectedAccount.currency]}{Number(amount * exchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})} {selectedAccount.currency}
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.conversionText}>
                                {filterCurrency} → {selectedAccount.currency} ханшаар хөрвүүлэгдэнэ
                            </Text>
                        )}
                    </View>
                )}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Тайлбар</Text>
                    <TextInput
                        style={styles.descInput}
                        placeholder="Шилжүүлгийн тайлбар (заавал биш)"
                        placeholderTextColor="#94a3b8"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                    />
                </View>
            </ScrollView>

            <SafeAreaView edges={['bottom']}>
                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        isSend ? styles.submitSend : styles.submitInvoice,
                        sending && styles.submitDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={sending}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitText}>
                        {sending ? 'Илгээж байна...' : isSend ? 'Илгээх' : 'Нэхэмжлэх'}
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
    phoneIcon: {fontSize: 18, marginRight: 10},
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
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 14,
        padding: 4,
        gap: 4,
    },
    toggleBtn: {flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center'},
    toggleActive: {backgroundColor: COLORS.accent},
    toggleText: {fontSize: 13, fontWeight: '600', color: COLORS.secondary},
    toggleTextActive: {color: '#fff'},
    descInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.toggleBg,
        padding: 14,
        fontSize: 15,
        color: '#0f172a',
        minHeight: 90,
        textAlignVertical: 'top',
    },
    conversionCard: {
        backgroundColor: COLORS.convertBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.convertBg,
        padding: 12,
        marginBottom: 20,
    },
    conversionText: {fontSize: 13, color: COLORS.convertText, fontWeight: '500'},
    submitBtn: {
        marginHorizontal: 16,
        marginBottom: 12,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitSend: {backgroundColor: COLORS.accent},
    submitInvoice: {backgroundColor: COLORS.primary},
    submitDisabled: {backgroundColor: COLORS.muted},
    submitText: {color: '#fff', fontWeight: '700', fontSize: 17},
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 20,
        minHeight: 64,
    },
    userCardLeft: {flex: 1},
    userCardPhone: {fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2},
    userCardName: {fontSize: 14, color: COLORS.secondary},
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userAvatarText: {color: '#fff', fontWeight: '700', fontSize: 16},
    userCardNotFound: {justifyContent: 'center'},
    userCardNotFoundText: {color: COLORS.muted, fontSize: 14},
});
