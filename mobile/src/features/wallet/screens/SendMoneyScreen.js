import {useEffect, useState} from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {
    CURRENCY_SIGN,
    MIN_PHONE_LOOKUP_LENGTH,
    EXCHANGE_RATE_FRACTION_DIGITS,
    AMOUNT_FRACTION_DIGITS,
    getCurrencyBg,
} from '../../../constants';
import {avatarColor, normalizePhone} from '../../../utils/helpers';
import {PhoneIcon} from '../../../components/icons';
import PinBottomSheet from '../../../components/PinBottomSheet';
import AccountCarousel from '../../../components/AccountCarousel';
import {useSendMoney} from '../hooks/useSendMoney';
import {useLanguage} from '../../../context/LanguageContext';
import {useTheme} from '../../../context/ThemeContext';

export default function SendMoneyScreen({
    action = 'send',
    amount = 0,
    currency: filterCurrency = null,
    onBack,
    onSuccess
}) {
    const {
        phoneInput, setPhoneInput,
        lookupUser, lookupLoading,
        currentUserPhone,
        recipients, addRecipient, removeRecipient,
        accounts, selectedId, setSelectedId, loadingAcc,
        myAccounts, receiverAccountId, setReceiverAccountId, loadingMyAcc,
        exchangeRate, loadingRate,
        sending,
        isSend, currency, selectedAccount, needsConversion,
        handleSubmit,
        pinVisible, handlePinConfirm, handlePinClose,
    } = useSendMoney({action, amount, filterCurrency, onSuccess});

    const {t} = useLanguage();
    const {colors} = useTheme();
    const [description, setDescription] = useState('');
    const [accountIndex, setAccountIndex] = useState(0);
    const [accountCarouselDragging, setAccountCarouselDragging] = useState(false);

    const isSelfPhone = (phone) => {
        const norm = normalizePhone(phone);
        return norm.length > 0 && norm === normalizePhone(currentUserPhone);
    };

    const isAlreadyAdded = (phone) =>
        recipients.some((r) => normalizePhone(r.phone) === normalizePhone(phone));

    useEffect(() => {
        if (accounts.length === 0) return;
        if (accountIndex > accounts.length - 1) { setAccountIndex(0); return; }
        setSelectedId(accounts[accountIndex].accountId);
    }, [accounts, accountIndex]);

    const currencySign = CURRENCY_SIGN[currency] ?? currency;
    const canSubmit = recipients.length > 0 && !sending;

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, {backgroundColor: colors.background, borderColor: colors.border}]}>
                    <TouchableOpacity onPress={onBack} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                        <Text style={[styles.backArrow, {color: colors.text}]}>‹</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {color: colors.text}]}>
                        {Number(amount).toLocaleString()} {currencySign} {t('илгээх', 'send')}
                    </Text>
                    <View style={{width: 32}}/>
                </View>
            </SafeAreaView>

            <ScrollView
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={!accountCarouselDragging}
            >
                {/* Recipient chips */}
                {recipients.length > 0 && (
                    <View style={styles.chipsRow}>
                        {recipients.map(({phone, user}) => (
                            <View key={phone} style={[styles.chip, {backgroundColor: colors.accentLight}]}>
                                <View style={[styles.chipAvatar, {backgroundColor: avatarColor(phone, colors)}]}>
                                    {user?.profileImageUrl
                                        ? <Image source={{uri: user.profileImageUrl}} style={styles.chipAvatarImg}/>
                                        : <Text style={styles.chipAvatarText}>{user?.initials ?? phone[0]}</Text>
                                    }
                                </View>
                                <Text style={[styles.chipName, {color: colors.accent}]} numberOfLines={1}>
                                    {user?.maskedName ?? phone}
                                </Text>
                                <TouchableOpacity onPress={() => removeRecipient(phone)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                                    <Text style={[styles.chipRemove, {color: colors.accent}]}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Phone input */}
                <View style={[styles.inputCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                    <PhoneIcon size={24} color={colors.muted}/>
                    <TextInput
                        style={[styles.phoneInput, {color: colors.text}]}
                        placeholder={t('Утасны дугаар оруулах', 'Enter phone number')}
                        placeholderTextColor={colors.muted}
                        value={phoneInput}
                        onChangeText={setPhoneInput}
                        keyboardType="phone-pad"
                    />
                    {lookupLoading && <Spinner size="small" color="$blue500"/>}
                </View>

                {/* Self-phone warning */}
                {isSelfPhone(phoneInput) && phoneInput.trim().length >= MIN_PHONE_LOOKUP_LENGTH && (
                    <View style={[styles.infoCard, {backgroundColor: colors.card}]}>
                        <Text style={[styles.infoText, {color: colors.muted}]}>
                            {t('Өөрийн дугаарт илгээх боломжгүй', 'Cannot send to your own number')}
                        </Text>
                    </View>
                )}

                {/* Already added */}
                {!isSelfPhone(phoneInput) && isAlreadyAdded(phoneInput) && phoneInput.trim().length >= MIN_PHONE_LOOKUP_LENGTH && (
                    <View style={[styles.infoCard, {backgroundColor: colors.card}]}>
                        <Text style={[styles.infoText, {color: colors.muted}]}>
                            {t('Аль хэдийн нэмэгдсэн', 'Already added')}
                        </Text>
                    </View>
                )}

                {/* Lookup result — tap to add */}
                {!lookupLoading && !isSelfPhone(phoneInput) && !isAlreadyAdded(phoneInput) && lookupUser && (
                    <TouchableOpacity
                        style={[styles.userCard, {backgroundColor: colors.card}]}
                        onPress={addRecipient}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.userAvatar, {backgroundColor: avatarColor(lookupUser.phoneNumber, colors)}]}>
                            {lookupUser.profileImageUrl
                                ? <Image source={{uri: lookupUser.profileImageUrl}} style={styles.userAvatarImage}/>
                                : <Text style={styles.userAvatarText}>{lookupUser.initials}</Text>
                            }
                        </View>
                        <View style={styles.userCardLeft}>
                            <Text style={[styles.userCardPhone, {color: colors.text}]}>{lookupUser.maskedName ?? lookupUser.phoneNumber}</Text>
                            <Text style={[styles.userCardName, {color: colors.muted}]}>{lookupUser.phoneNumber}</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Not found */}
                {!lookupLoading && !isSelfPhone(phoneInput) && !isAlreadyAdded(phoneInput) && phoneInput.trim().length >= MIN_PHONE_LOOKUP_LENGTH && !lookupUser && (
                    <View style={[styles.infoCard, {backgroundColor: colors.card}]}>
                        <Text style={[styles.infoText, {color: colors.muted}]}>{t('Хэрэглэгч олдсонгүй', 'User not found')}</Text>
                    </View>
                )}

                {/* From account */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, {color: colors.muted}]}>{t('Илгээх данс', 'From account')}</Text>
                    {loadingAcc ? (
                        <View style={styles.centerPad}><Spinner color="$blue500"/></View>
                    ) : accounts.length === 0 ? (
                        <View style={[styles.emptyCard, {backgroundColor: colors.card}]}>
                            <Text style={[styles.emptyText, {color: colors.muted}]}>{t('Данс байхгүй байна', 'No accounts found')}</Text>
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

                {/* Exchange rate */}
                {needsConversion && (
                    <View style={[styles.conversionCard, {backgroundColor: colors.convertBg, borderColor: colors.border}]}>
                        <Text style={[styles.conversionTitle, {color: colors.convertText}]}>{t('Ханш хөрвүүлэлт', 'Exchange Rate')}</Text>
                        {loadingRate ? (
                            <View style={styles.conversionLoading}>
                                <Spinner size="small" color="$blue500"/>
                                <Text style={[styles.conversionLoadingText, {color: colors.convertText}]}>{t('Ханш татаж байна...', 'Loading rate...')}</Text>
                            </View>
                        ) : exchangeRate ? (
                            <>
                                <View style={styles.conversionRateRow}>
                                    <Text style={[styles.conversionRateLabel, {color: colors.muted}]}>1 {filterCurrency}</Text>
                                    <Text style={[styles.conversionRateEq, {color: colors.convertText}]}>≈</Text>
                                    <Text style={[styles.conversionRateValue, {color: colors.text}]}>
                                        {CURRENCY_SIGN[selectedAccount.currency]}{Number(exchangeRate).toLocaleString(undefined, {maximumFractionDigits: EXCHANGE_RATE_FRACTION_DIGITS})} {selectedAccount.currency}
                                    </Text>
                                </View>
                                <View style={[styles.conversionDivider, {backgroundColor: colors.border}]}/>
                                <View style={styles.conversionAmountRow}>
                                    <View style={[styles.conversionAmountBox, {backgroundColor: colors.surface}]}>
                                        <Text style={[styles.conversionAmountLabel, {color: colors.muted}]}>{filterCurrency}</Text>
                                        <Text style={[styles.conversionAmountValue, {color: colors.text}]}>
                                            {CURRENCY_SIGN[filterCurrency]}{Number(amount).toLocaleString()}
                                        </Text>
                                    </View>
                                    <Text style={[styles.conversionArrow, {color: colors.convertText}]}>→</Text>
                                    <View style={[styles.conversionAmountBox, {backgroundColor: colors.accentLight}]}>
                                        <Text style={[styles.conversionAmountLabel, {color: colors.muted}]}>{selectedAccount.currency}</Text>
                                        <Text style={[styles.conversionAmountValue, {color: colors.convertText}]}>
                                            {CURRENCY_SIGN[selectedAccount.currency]}{Number(amount * exchangeRate).toLocaleString(undefined, {maximumFractionDigits: AMOUNT_FRACTION_DIGITS})}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <Text style={[styles.conversionLoadingText, {color: colors.convertText}]}>
                                {filterCurrency} → {selectedAccount.currency} {t('ханш авах боломжгүй байна', 'exchange rate unavailable')}
                            </Text>
                        )}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, {color: colors.muted}]}>{t('Тайлбар', 'Description')}</Text>
                    <TextInput
                        style={[styles.descInput, {backgroundColor: colors.card, borderColor: colors.border, color: colors.text}]}
                        placeholder={t('Шилжүүлгийн тайлбар (заавал биш)', 'Transfer description (optional)')}
                        placeholderTextColor={colors.muted}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                    />
                </View>
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={{backgroundColor: colors.background}}>
                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        {backgroundColor: colors.accent},
                        !canSubmit && {backgroundColor: colors.muted},
                    ]}
                    onPress={() => handleSubmit(description)}
                    disabled={!canSubmit}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.submitText, {color: colors.textOnPrimary}]}>
                        {sending
                            ? t('Илгээж байна...', 'Sending...')
                            : recipients.length > 1
                                ? `${recipients.length} ${t('хүнд илгээх', 'people')}`
                                : t('Илгээх', 'Send')}
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
    container: {flex: 1},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    backArrow: {fontSize: 32, lineHeight: 36},
    headerTitle: {fontSize: 17, fontWeight: '700'},
    body: {padding: 20, paddingBottom: 32},
    // Chips
    chipsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
    chip: {flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingLeft: 4, paddingRight: 10, paddingVertical: 4, gap: 6},
    chipAvatar: {width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center'},
    chipAvatarImg: {width: 26, height: 26, borderRadius: 13},
    chipAvatarText: {color: '#fff', fontWeight: '700', fontSize: 10},
    chipName: {fontWeight: '600', fontSize: 13},
    chipRemove: {fontSize: 13, fontWeight: '700'},
    // Input
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 10,
        borderWidth: 1,
    },
    phoneInput: {flex: 1, fontSize: 16, paddingVertical: 14},
    // Info / not found
    infoCard: {borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10},
    infoText: {fontSize: 14},
    // User card
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        gap: 12,
    },
    userCardLeft: {flex: 1},
    userCardPhone: {fontSize: 16, fontWeight: '700', marginBottom: 2},
    userCardName: {fontSize: 14},
    userAvatar: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
    userAvatarImage: {width: 44, height: 44, borderRadius: 22},
    userAvatarText: {color: '#fff', fontWeight: '700', fontSize: 15},
    // Account / sections
    section: {marginBottom: 20},
    sectionLabel: {fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6},
    centerPad: {paddingVertical: 24, alignItems: 'center'},
    emptyCard: {borderRadius: 12, padding: 16},
    emptyText: {fontSize: 14},
    badge: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12},
    badgeText: {color: '#fff', fontWeight: '700', fontSize: 11},
    // Conversion
    conversionCard: {borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20},
    conversionTitle: {fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12},
    conversionLoading: {flexDirection: 'row', alignItems: 'center', gap: 8},
    conversionLoadingText: {fontSize: 13},
    conversionRateRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12},
    conversionRateLabel: {fontSize: 13, fontWeight: '500'},
    conversionRateEq: {fontSize: 14, fontWeight: '700'},
    conversionRateValue: {fontSize: 14, fontWeight: '700', flex: 1},
    conversionDivider: {height: 1, marginBottom: 12},
    conversionAmountRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    conversionAmountBox: {flex: 1, borderRadius: 12, padding: 12},
    conversionAmountLabel: {fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4},
    conversionAmountValue: {fontSize: 17, fontWeight: '800'},
    conversionArrow: {fontSize: 20, fontWeight: '700'},
    // Description
    descInput: {borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 90, textAlignVertical: 'top'},
    // Submit
    submitBtn: {marginHorizontal: 16, marginBottom: 12, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center'},
    submitText: {fontWeight: '700', fontSize: 17},
});
