import {useEffect, useState} from 'react';
import {
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {
    CURRENCY_BG,
    CURRENCY_SIGN,
    CURRENCY_FALLBACK_BG,
    COLORS,
    MIN_PHONE_LOOKUP_LENGTH,
    EXCHANGE_RATE_FRACTION_DIGITS,
    AMOUNT_FRACTION_DIGITS
} from '../../../constants';
import {avatarColor, normalizePhone} from '../../../utils/helpers';
import {PhoneIcon} from '../../../components/icons';
import PinBottomSheet from '../../../components/PinBottomSheet';
import AccountCarousel from '../../../components/AccountCarousel';
import {useSendMoney} from '../hooks/useSendMoney';

export default function SendMoneyScreen({
                                            action = 'send',
                                            amount = 0,
                                            currency: filterCurrency = null,
                                            onBack,
                                            onSuccess
                                        }) {
    const {
        receiverPhone, setReceiverPhone,
        receiverUser, lookupLoading,
        currentUserPhone,
        accounts, setSelectedId, loadingAcc,
        myAccounts, receiverAccountId, setReceiverAccountId, loadingMyAcc,
        exchangeRate, loadingRate,
        sending,
        isSend, currency, selectedAccount, needsConversion,
        handleSubmit,
        pinVisible, handlePinConfirm, handlePinClose,
    } = useSendMoney({action, amount, filterCurrency, onSuccess});

    const [description, setDescription] = useState('');
    const [accountIndex, setAccountIndex] = useState(0);
    const [accountCarouselDragging, setAccountCarouselDragging] = useState(false);

    const isSelfPhone = (phone) => {
        const norm = normalizePhone(phone);
        return norm.length > 0 && norm === normalizePhone(currentUserPhone);
    };

    const handlePhoneChange = (text) => {
        setReceiverPhone(text);
    };

    useEffect(() => {
        if (accounts.length === 0) return;
        if (accountIndex > accounts.length - 1) {
            setAccountIndex(0);
            return;
        }
        setSelectedId(accounts[accountIndex].accountId);
    }, [accounts, accountIndex]);

    const currencySign = CURRENCY_SIGN[currency] ?? currency;

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

            <ScrollView
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={!accountCarouselDragging}
            >
                <View style={styles.inputCard}>
                    <PhoneIcon size={24} color="#94a3b8"/>
                    <TextInput
                        style={styles.phoneInput}
                        placeholder="Утасны дугаар оруулах"
                        placeholderTextColor="#94a3b8"
                        value={receiverPhone}
                        onChangeText={handlePhoneChange}
                        keyboardType="phone-pad"
                    />
                </View>

                {isSelfPhone(receiverPhone) && receiverPhone.trim().length >= MIN_PHONE_LOOKUP_LENGTH && (
                    <View style={[styles.userCard, styles.userCardNotFound]}>
                        <Text style={styles.userCardNotFoundText}>
                            Өөрийн дугаарт {isSend ? 'илгээх' : 'нэхэмжлэх'} боломжгүй
                        </Text>
                    </View>
                )}

                {lookupLoading && (
                    <View style={styles.userCard}>
                        <Spinner size="small" color={COLORS.accent}/>
                    </View>
                )}
                {!lookupLoading && !isSelfPhone(receiverPhone) && receiverUser && (
                    <View style={styles.userCard}>
                        <View style={styles.userCardLeft}>
                            <Text style={styles.userCardPhone}>{receiverUser.phoneNumber}</Text>
                            <Text style={styles.userCardName}>{receiverUser.maskedName}</Text>
                        </View>
                        <View style={[styles.userAvatar, {backgroundColor: avatarColor(receiverUser.username)}]}>
                            <Text style={styles.userAvatarText}>{receiverUser.initials}</Text>
                        </View>
                    </View>
                )}
                {!lookupLoading && !isSelfPhone(receiverPhone) && receiverPhone.trim().length >= MIN_PHONE_LOOKUP_LENGTH && !receiverUser && (
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
                            <AccountCarousel
                                accounts={accounts}
                                index={accountIndex}
                                onIndexChange={setAccountIndex}
                                onDragStateChange={setAccountCarouselDragging}
                            />
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
                            myAccounts.map((account) => {
                                const active = receiverAccountId === account.accountId;
                                const currencySymbol = CURRENCY_SIGN[account.currency] ?? account.currency;
                                return (
                                    <TouchableOpacity
                                        key={account.accountId}
                                        style={[styles.accountRow, active && styles.accountRowActive]}
                                        onPress={() => setReceiverAccountId(account.accountId)}
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
                )}

                {needsConversion && (
                    <View style={styles.conversionCard}>
                        <Text style={styles.conversionTitle}>Ханш хөрвүүлэлт</Text>
                        {loadingRate ? (
                            <View style={styles.conversionLoading}>
                                <Spinner size="small" color={COLORS.convertText}/>
                                <Text style={styles.conversionLoadingText}>Ханш татаж байна...</Text>
                            </View>
                        ) : exchangeRate ? (
                            <>
                                <View style={styles.conversionRateRow}>
                                    <Text style={styles.conversionRateLabel}>1 {filterCurrency}</Text>
                                    <Text style={styles.conversionRateEq}>≈</Text>
                                    <Text style={styles.conversionRateValue}>
                                        {CURRENCY_SIGN[selectedAccount.currency]}{Number(exchangeRate).toLocaleString(undefined, {maximumFractionDigits: EXCHANGE_RATE_FRACTION_DIGITS})} {selectedAccount.currency}
                                    </Text>
                                </View>
                                <View style={styles.conversionDivider}/>
                                <View style={styles.conversionAmountRow}>
                                    <View style={styles.conversionAmountBox}>
                                        <Text style={styles.conversionAmountLabel}>{filterCurrency}</Text>
                                        <Text style={styles.conversionAmountValue}>
                                            {CURRENCY_SIGN[filterCurrency]}{Number(amount).toLocaleString()}
                                        </Text>
                                    </View>
                                    <Text style={styles.conversionArrow}>→</Text>
                                    <View style={[styles.conversionAmountBox, styles.conversionAmountBoxResult]}>
                                        <Text style={styles.conversionAmountLabel}>{selectedAccount.currency}</Text>
                                        <Text style={[styles.conversionAmountValue, styles.conversionAmountValueResult]}>
                                            {CURRENCY_SIGN[selectedAccount.currency]}{Number(amount * exchangeRate).toLocaleString(undefined, {maximumFractionDigits: AMOUNT_FRACTION_DIGITS})}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <Text style={styles.conversionLoadingText}>
                                {filterCurrency} → {selectedAccount.currency} ханш авах боломжгүй байна
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
                    onPress={() => handleSubmit(description)}
                    disabled={sending}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitText}>
                        {sending ? 'Илгээж байна...' : isSend ? 'Илгээх' : 'Нэхэмжлэх'}
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>

            <PinBottomSheet
                visible={pinVisible}
                onConfirm={handlePinConfirm}
                onClose={handlePinClose}
                loading={sending}
            />
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
    badge: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12},
    badgeText: {color: '#fff', fontWeight: '700', fontSize: 11},
    accNum: {fontSize: 12, color: COLORS.muted, marginBottom: 2},
    accBal: {fontSize: 16, fontWeight: '700', color: '#0f172a'},
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
        borderColor: COLORS.toggleBg,
        padding: 14,
        fontSize: 15,
        color: '#0f172a',
        minHeight: 90,
        textAlignVertical: 'top',
    },
    conversionCard: {
        backgroundColor: COLORS.convertBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e9d5ff',
        padding: 16,
        marginBottom: 20,
    },
    conversionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.convertText,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    conversionLoading: {flexDirection: 'row', alignItems: 'center', gap: 8},
    conversionLoadingText: {fontSize: 13, color: COLORS.convertText},
    conversionRateRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12},
    conversionRateLabel: {fontSize: 13, color: COLORS.secondary, fontWeight: '500'},
    conversionRateEq: {fontSize: 14, color: COLORS.convertText, fontWeight: '700'},
    conversionRateValue: {fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1},
    conversionDivider: {height: 1, backgroundColor: '#e9d5ff', marginBottom: 12},
    conversionAmountRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    conversionAmountBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
    },
    conversionAmountBoxResult: {
        backgroundColor: '#f3e8ff',
    },
    conversionAmountLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    conversionAmountValue: {fontSize: 17, fontWeight: '800', color: '#0f172a'},
    conversionAmountValueResult: {color: COLORS.convertText},
    conversionArrow: {fontSize: 20, color: COLORS.convertText, fontWeight: '700'},
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
