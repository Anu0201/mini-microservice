import {useEffect, useRef, useState} from 'react';
import {ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {
    CURRENCY_BG,
    CURRENCY_SIGN,
    CURRENCY_FALLBACK_BG,
    COLORS,
    MIN_PHONE_LOOKUP_LENGTH,
    PHONE_LOOKUP_DEBOUNCE_MS
} from '../../../constants';
import {PhoneIcon} from '../../../components/icons';
import {useCreateInvoice} from '../hooks/useCreateInvoice';
import {lookupUserByPhone} from '../../../services/userApi';
import {initials, maskName, avatarColor} from '../../../utils/helpers';

export default function CreateInvoiceScreen({onBack, onSuccess, currency = 'MNT', initialAmount = ''}) {
    const {
        myAccounts, selectedAccountId, setSelectedAccountId, loadingAccounts, sending, handleSubmit, handleSplitSubmit,
        receiverUser, lookupLoading, lookupPhone
    } =
        useCreateInvoice({currency, initialAmount, onSuccess});

    const [receiverPhone, setReceiverPhone] = useState('');
    const handlePhoneChange = (text) => {
        setReceiverPhone(text);
        lookupPhone(text);
    };
    const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');

    const [splitMode, setSplitMode] = useState(false);
    const [splitTotal, setSplitTotal] = useState(initialAmount ? String(initialAmount) : '');
    const [includeSelf, setIncludeSelf] = useState(true);
    const [peopleCount, setPeopleCount] = useState('');
    const [splitPhones, setSplitPhones] = useState([]);
    const [splitUserResults, setSplitUserResults] = useState([]);
    const [splitLookupLoading, setSplitLookupLoading] = useState([]);
    const splitLookupTimers = useRef([]);

    const [description, setDescription] = useState('');

    const currencySign = CURRENCY_SIGN[currency] ?? currency;
    const parsedSplitTotal = parseFloat(splitTotal) || 0;
    const parsedPeopleCount = parseInt(peopleCount) || 0;
    const minPeopleCount = includeSelf ? 3 : 2;
    const countInvalid = peopleCount !== '' && parsedPeopleCount < minPeopleCount;
    const perPerson = !countInvalid && parsedPeopleCount > 0 ? Math.ceil(parsedSplitTotal / parsedPeopleCount) : 0;
    const phoneInputCount = !countInvalid && parsedPeopleCount > 0
        ? (includeSelf ? parsedPeopleCount - 1 : parsedPeopleCount)
        : 0;

    useEffect(() => {
        setSplitPhones(prev => Array(phoneInputCount).fill('').map((_, i) => prev[i] || ''));
        setSplitUserResults(prev => Array(phoneInputCount).fill(null).map((_, i) => prev[i] ?? null));
        setSplitLookupLoading(prev => Array(phoneInputCount).fill(false).map((_, i) => prev[i] ?? false));
    }, [phoneInputCount]);

    const displayAmount = initialAmount > 0 ? Number(initialAmount).toLocaleString() : (amount || '0');

    const lookupSplitPhone = (idx, phone) => {
        setSplitUserResults(prev => {
            const r = [...prev];
            r[idx] = null;
            return r;
        });
        if (splitLookupTimers.current[idx]) clearTimeout(splitLookupTimers.current[idx]);
        if (phone.trim().length < MIN_PHONE_LOOKUP_LENGTH) return;
        setSplitLookupLoading(prev => {
            const r = [...prev];
            r[idx] = true;
            return r;
        });
        splitLookupTimers.current[idx] = setTimeout(async () => {
            try {
                const res = await lookupUserByPhone(phone.trim());
                setSplitUserResults(prev => {
                    const r = [...prev];
                    r[idx] = res.data;
                    return r;
                });
            } catch {
                setSplitUserResults(prev => {
                    const r = [...prev];
                    r[idx] = null;
                    return r;
                });
            } finally {
                setSplitLookupLoading(prev => {
                    const r = [...prev];
                    r[idx] = false;
                    return r;
                });
            }
        }, PHONE_LOOKUP_DEBOUNCE_MS);
    };

    const updateSplitPhone = (idx, text) => {
        setSplitPhones(prev => {
            const updated = [...prev];
            updated[idx] = text;
            return updated;
        });
        lookupSplitPhone(idx, text);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                        <Text style={styles.backArrow}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {splitMode
                            ? (perPerson > 0 ? `Тус бүр ${perPerson.toLocaleString()} ${currencySign}` : 'Хуваалцах')
                            : `${displayAmount} ${currencySign} нэхэмжлэх`}
                    </Text>
                    <View style={{width: 32}}/>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

                {/* Mode tabs */}
                <View style={styles.modeTabs}>
                    <TouchableOpacity
                        style={[styles.modeTab, !splitMode && styles.modeTabActive]}
                        onPress={() => setSplitMode(false)}
                    >
                        <Text style={[styles.modeTabText, !splitMode && styles.modeTabTextActive]}>Нэхэмжлэх</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeTab, splitMode && styles.modeTabActive]}
                        onPress={() => setSplitMode(true)}
                    >
                        <Text style={[styles.modeTabText, splitMode && styles.modeTabTextActive]}>Хуваалцах</Text>
                    </TouchableOpacity>
                </View>

                {!splitMode ? (
                    <>
                        <View style={styles.inputCard}>
                            <PhoneIcon size={24} color={COLORS.muted}/>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="Утасны дугаар оруулах"
                                placeholderTextColor={COLORS.muted}
                                value={receiverPhone}
                                onChangeText={handlePhoneChange}
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
                                <View style={{flex: 1}}>
                                    <Text style={styles.userCardPhone}>{receiverUser.phoneNumber}</Text>
                                    <Text style={styles.userCardName}>{maskName(receiverUser.username)}</Text>
                                </View>
                                <View
                                    style={[styles.userAvatar, {backgroundColor: avatarColor(receiverUser.username)}]}>
                                    <Text style={styles.userAvatarText}>{initials(receiverUser.username)}</Text>
                                </View>
                            </View>
                        )}
                        {!lookupLoading && receiverPhone.trim().length >= MIN_PHONE_LOOKUP_LENGTH && !receiverUser && (
                            <View style={[styles.userCard, styles.userCardNotFound]}>
                                <Text style={styles.userCardNotFoundText}>Хэрэглэгч олдсонгүй</Text>
                            </View>
                        )}

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
                    </>
                ) : (
                    <>
                        {/* Total amount */}
                        <View style={styles.inputCard}>
                            <Text style={styles.amountPrefix}>{currencySign}</Text>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="Нийт дүн"
                                placeholderTextColor={COLORS.muted}
                                value={splitTotal}
                                onChangeText={setSplitTotal}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={styles.splitOptionsRow}>
                            <View style={styles.splitToggleCard}>
                                <Text style={styles.splitToggleLabel}>Өөрийгөө оруулах</Text>
                                <Switch
                                    value={includeSelf}
                                    onValueChange={setIncludeSelf}
                                    trackColor={{false: '#e2e8f0', true: COLORS.accent}}
                                    thumbColor="#fff"
                                />
                            </View>
                            <View style={[styles.inputCard, {width: 70, marginBottom: 0}]}>
                                <TextInput
                                    style={[styles.phoneInput, {textAlign: 'center'}]}
                                    placeholder="Тоо"
                                    placeholderTextColor={COLORS.muted}
                                    value={peopleCount}
                                    onChangeText={setPeopleCount}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>

                        {countInvalid && (
                            <Text style={styles.countError}>
                                {includeSelf ? 'Өөрийгөө оруулбал хамгийн багадаа 3 хүн байна.' : 'Хамгийн багадаа 2 хүн байна.'}
                            </Text>
                        )}

                        {perPerson > 0 && (
                            <View style={styles.perPersonCard}>
                                <Text style={styles.perPersonLabel}>Тус бүрт</Text>
                                <Text style={styles.perPersonAmount}>
                                    {perPerson.toLocaleString()} {currencySign}
                                </Text>
                            </View>
                        )}

                        {splitPhones.map((phone, idx) => (
                            <View key={idx} style={styles.splitPhoneWrapper}>
                                <View style={[styles.inputCard, {marginBottom: 0}]}>
                                    <PhoneIcon size={24} color={COLORS.muted}/>
                                    <TextInput
                                        style={styles.phoneInput}
                                        placeholder={`${idx + 1}-р хүний дугаар`}
                                        placeholderTextColor={COLORS.muted}
                                        value={phone}
                                        onChangeText={(text) => updateSplitPhone(idx, text)}
                                        keyboardType="phone-pad"
                                    />
                                    {splitLookupLoading[idx] && <Spinner size="small" color={COLORS.accent}/>}
                                </View>
                                {!splitLookupLoading[idx] && splitUserResults[idx] && (
                                    <View style={styles.userCard}>
                                        <View style={{flex: 1}}>
                                            <Text
                                                style={styles.userCardPhone}>{splitUserResults[idx].phoneNumber}</Text>
                                            <Text
                                                style={styles.userCardName}>{maskName(splitUserResults[idx].username)}</Text>
                                        </View>
                                        <View
                                            style={[styles.userAvatar, {backgroundColor: avatarColor(splitUserResults[idx].username)}]}>
                                            <Text
                                                style={styles.userAvatarText}>{initials(splitUserResults[idx].username)}</Text>
                                        </View>
                                    </View>
                                )}
                                {!splitLookupLoading[idx] && phone.trim().length >= MIN_PHONE_LOOKUP_LENGTH && !splitUserResults[idx] && (
                                    <View style={[styles.userCard, styles.userCardNotFound]}>
                                        <Text style={styles.userCardNotFoundText}>Хэрэглэгч олдсонгүй</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </>
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
                        myAccounts.map((account) => {
                            const active = selectedAccountId === account.accountId;
                            const currencySymbol = CURRENCY_SIGN[account.currency] ?? account.currency;
                            return (
                                <TouchableOpacity
                                    key={account.accountId}
                                    style={[styles.accountRow, active && styles.accountRowActive]}
                                    onPress={() => setSelectedAccountId(account.accountId)}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        style={[styles.badge, {backgroundColor: CURRENCY_BG[account.currency] ?? CURRENCY_FALLBACK_BG}]}>
                                        <Text style={styles.badgeText}>{account.currency}</Text>
                                    </View>
                                    <View style={{flex: 1}}>
                                        <Text style={styles.accNum}>{account.accountNumber}</Text>
                                        <Text style={styles.accBal}>
                                            {Number(account.balance).toLocaleString()} {currencySymbol}
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
                        placeholder="Тайлбар"
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
                    onPress={() => splitMode
                        ? handleSplitSubmit({
                            totalAmount: parsedSplitTotal,
                            peopleCount: parsedPeopleCount,
                            phones: splitPhones,
                            description
                        })
                        : handleSubmit({receiverPhone, amount, description})
                    }
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
    modeTabs: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    modeTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    modeTabActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 1},
        elevation: 2,
    },
    modeTabText: {fontSize: 14, fontWeight: '600', color: COLORS.muted},
    modeTabTextActive: {color: '#0f172a'},
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
    splitOptionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    splitToggleCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    splitToggleLabel: {fontSize: 14, fontWeight: '600', color: '#0f172a'},
    perPersonCard: {
        backgroundColor: COLORS.accentLight,
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    perPersonLabel: {fontSize: 14, fontWeight: '600', color: COLORS.accent},
    perPersonAmount: {fontSize: 22, fontWeight: '800', color: COLORS.accent},
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
    userCardPhone: {fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2},
    userCardName: {fontSize: 14, color: COLORS.secondary},
    userAvatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: COLORS.accent,
        alignItems: 'center', justifyContent: 'center',
    },
    userAvatarText: {color: '#fff', fontWeight: '700', fontSize: 16},
    userCardNotFound: {justifyContent: 'center'},
    userCardNotFoundText: {color: COLORS.muted, fontSize: 14},
    countError: {fontSize: 13, color: '#ef4444', marginBottom: 14, paddingHorizontal: 4},
    splitPhoneWrapper: {marginBottom: 16},
});