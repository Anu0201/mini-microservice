import {useState} from 'react';
import {ScrollView, StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {CURRENCY_BG, CURRENCY_SIGN, CURRENCY_FALLBACK_BG, COLORS, MIN_PHONE_LOOKUP_LENGTH, EXCHANGE_RATE_FRACTION_DIGITS, AMOUNT_FRACTION_DIGITS} from '../../../constants';
import {initials, maskName} from '../../../utils/helpers';
import {PhoneIcon} from '../../../components/icons';
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
        accounts, selectedId, setSelectedId, loadingAcc,
        myAccounts, receiverAccountId, setReceiverAccountId, loadingMyAcc,
        exchangeRate, loadingRate,
        sending,
        isSend, currency, selectedAccount, needsConversion,
        handleSubmit,
    } = useSendMoney({action, amount, filterCurrency, onSuccess});

    const [description, setDescription] = useState('');
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
                {!lookupLoading && receiverPhone.trim().length >= MIN_PHONE_LOOKUP_LENGTH && !receiverUser && (
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
                            accounts.map((account) => {
                                const active = selectedId === account.accountId;
                                const currencySymbol = CURRENCY_SIGN[account.currency] ?? account.currency;
                                return (
                                    <TouchableOpacity
                                        key={account.accountId}
                                        style={[styles.accountRow, active && styles.accountRowActive]}
                                        onPress={() => setSelectedId(account.accountId)}
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
                        {loadingRate ? (
                            <Text style={styles.conversionText}>Ханш татаж байна...</Text>
                        ) : exchangeRate ? (
                            <>
                                <Text style={styles.conversionText}>
                                    1 {filterCurrency} = {CURRENCY_SIGN[selectedAccount.currency]}{Number(exchangeRate).toLocaleString(undefined, {maximumFractionDigits: EXCHANGE_RATE_FRACTION_DIGITS})} {selectedAccount.currency}
                                </Text>
                                <Text style={[styles.conversionText, {marginTop: 4, fontWeight: '700'}]}>
                                    {CURRENCY_SIGN[filterCurrency]}{Number(amount).toLocaleString()} {filterCurrency} → {CURRENCY_SIGN[selectedAccount.currency]}{Number(amount * exchangeRate).toLocaleString(undefined, {maximumFractionDigits: AMOUNT_FRACTION_DIGITS})} {selectedAccount.currency}
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
                    onPress={() => handleSubmit(description)}
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
