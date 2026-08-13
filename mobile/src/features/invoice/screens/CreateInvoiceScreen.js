import {useEffect, useRef, useState} from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {
    CURRENCY_SIGN,
    MIN_PHONE_LOOKUP_LENGTH,
    PHONE_LOOKUP_DEBOUNCE_MS
} from '../../../constants';
import {PhoneIcon} from '../../../components/icons';
import {useCreateInvoice} from '../hooks/useCreateInvoice';
import {lookupUserByPhone} from '../../../services/userApi';
import {avatarColor, normalizePhone} from '../../../utils/helpers';
import AccountCarousel from '../../../components/AccountCarousel';
import {useLanguage} from '../../../context/LanguageContext';
import {useTheme} from '../../../context/ThemeContext';

const MIN_SPLIT_PHONES = 2;

export default function CreateInvoiceScreen({onBack, onSuccess, currency = 'MNT', initialAmount = ''}) {
    const {
        myAccounts, setSelectedAccountId, loadingAccounts, sending, handleSubmit, handleSplitSubmit,
        receiverUser, lookupLoading, lookupPhone,
        currentUserPhone
    } = useCreateInvoice({currency, initialAmount, onSuccess});

    const {t} = useLanguage();
    const {colors} = useTheme();

    const isSelfPhone = (phone) => {
        const norm = normalizePhone(phone);
        return norm.length > 0 && norm === normalizePhone(currentUserPhone);
    };

    const [receiverPhone, setReceiverPhone] = useState('');
    const handlePhoneChange = (text) => {
        setReceiverPhone(text);
        if (isSelfPhone(text.trim())) return;
        lookupPhone(text);
    };
    const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');

    const [splitMode, setSplitMode] = useState(false);
    const [includeSelf, setIncludeSelf] = useState(true);

    const [splitPhoneInput, setSplitPhoneInput] = useState('');
    const [splitLookupLoading, setSplitLookupLoading] = useState(false);
    const [splitLookupUser, setSplitLookupUser] = useState(null);
    const [splitPhones, setSplitPhones] = useState([]);
    const [splitUsers, setSplitUsers] = useState({});
    const splitLookupTimer = useRef(null);

    const [description, setDescription] = useState('');

    const [accountIndex, setAccountIndex] = useState(0);
    const [accountCarouselDragging, setAccountCarouselDragging] = useState(false);
    useEffect(() => {
        if (myAccounts.length === 0) return;
        if (accountIndex > myAccounts.length - 1) {
            setAccountIndex(0);
            return;
        }
        setSelectedAccountId(myAccounts[accountIndex].accountId);
    }, [myAccounts, accountIndex]);

    const currencySign = CURRENCY_SIGN[currency] ?? currency;
    const parsedSplitTotal = initialAmount > 0 ? Number(initialAmount) : (parseFloat(amount) || 0);
    const participantCount = splitPhones.length + (includeSelf ? 1 : 0);
    const perPerson = parsedSplitTotal > 0 && participantCount > 0
        ? Math.ceil(parsedSplitTotal / participantCount)
        : 0;
    const canSubmitSplit = splitPhones.length >= MIN_SPLIT_PHONES;

    const handleToggleSplit = (value) => {
        setSplitMode(value);
        setSplitPhoneInput('');
        setSplitLookupUser(null);
        setSplitLookupLoading(false);
        setSplitPhones([]);
        setSplitUsers({});
        if (splitLookupTimer.current) clearTimeout(splitLookupTimer.current);
    };

    const handleSplitInputChange = (text) => {
        setSplitPhoneInput(text);
        setSplitLookupUser(null);
        if (splitLookupTimer.current) clearTimeout(splitLookupTimer.current);
        const phone = text.trim();
        if (phone.length < MIN_PHONE_LOOKUP_LENGTH) { setSplitLookupLoading(false); return; }
        if (isSelfPhone(phone)) { setSplitLookupLoading(false); return; }
        setSplitLookupLoading(true);
        splitLookupTimer.current = setTimeout(async () => {
            try {
                const res = await lookupUserByPhone(phone);
                setSplitLookupUser(res.data ?? null);
            } catch {
                setSplitLookupUser(null);
            } finally {
                setSplitLookupLoading(false);
            }
        }, PHONE_LOOKUP_DEBOUNCE_MS);
    };

    const selectSplitUser = () => {
        const phone = splitPhoneInput.trim();
        if (!splitLookupUser || splitPhones.includes(phone)) return;
        if (isSelfPhone(phone)) return;
        setSplitPhones(prev => [...prev, phone]);
        setSplitUsers(prev => ({...prev, [phone]: splitLookupUser}));
        setSplitPhoneInput('');
        setSplitLookupUser(null);
    };

    const removeSplitPhone = (phone) => {
        setSplitPhones(prev => prev.filter(p => p !== phone));
        setSplitUsers(prev => { const next = {...prev}; delete next[phone]; return next; });
    };

    const displayAmount = initialAmount > 0 ? Number(initialAmount).toLocaleString() : (amount || '0');
    const canSubmitSingle = receiverPhone.trim().length > 0 && !isSelfPhone(receiverPhone);

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, {backgroundColor: colors.background, borderColor: colors.border}]}>
                    <TouchableOpacity onPress={onBack} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                        <Text style={[styles.backArrow, {color: colors.text}]}>‹</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {color: colors.text}]}>
                        {splitMode
                            ? `${displayAmount} ${currencySign} ${t('хуваалцах', 'split')}`
                            : `${displayAmount} ${currencySign} ${t('нэхэмжлэх', 'invoice')}`}
                    </Text>
                    <View style={{width: 32}}/>
                </View>
            </SafeAreaView>

            <ScrollView
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={!accountCarouselDragging}
            >
                <View style={[styles.splitHeroCard, {backgroundColor: colors.accentLight}]}>
                    <View style={{flex: 1}}>
                        <Text style={[styles.splitHeroTitle, {color: colors.text}]}>{t('Хэсэгчлэн хуваалцах', 'Split invoice')}</Text>
                        <Text style={[styles.splitHeroSubtitle, {color: colors.muted}]}>
                            {t('Нийт дүнг олон хүнд хуваан нэхэмжлэх', 'Split the total amount among multiple people')}
                        </Text>
                    </View>
                    <Switch
                        value={splitMode}
                        onValueChange={handleToggleSplit}
                        trackColor={{false: colors.border, true: colors.accent}}
                        thumbColor="#fff"
                    />
                </View>

                {!splitMode ? (
                    <>
                        <View style={[styles.inputCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                            <PhoneIcon size={24} color={colors.muted}/>
                            <TextInput
                                style={[styles.phoneInput, {color: colors.text}]}
                                placeholder={t('Утасны дугаар оруулах', 'Enter phone number')}
                                placeholderTextColor={colors.muted}
                                value={receiverPhone}
                                onChangeText={handlePhoneChange}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {isSelfPhone(receiverPhone) && receiverPhone.trim().length >= MIN_PHONE_LOOKUP_LENGTH && (
                            <View style={[styles.userCard, {backgroundColor: colors.card}]}>
                                <Text style={[styles.userCardNotFoundText, {color: colors.muted}]}>
                                    {t('Өөрийн дугаарт нэхэмжлэх боломжгүй', 'Cannot invoice your own number')}
                                </Text>
                            </View>
                        )}

                        {!lookupLoading && !isSelfPhone(receiverPhone) && receiverUser && (
                            <View style={[styles.userCard, {backgroundColor: colors.card}]}>
                                <View style={{flex: 1}}>
                                    <Text style={[styles.userCardPhone, {color: colors.text}]}>{receiverUser.phoneNumber}</Text>
                                    <Text style={[styles.userCardName, {color: colors.muted}]}>{receiverUser.maskedName}</Text>
                                </View>
                                <View style={[styles.userAvatar, {backgroundColor: avatarColor(receiverUser.phoneNumber, colors)}]}>
                                    {receiverUser.profileImageUrl
                                        ? <Image source={{uri: receiverUser.profileImageUrl}} style={styles.userAvatarImage}/>
                                        : <Text style={styles.userAvatarText}>{receiverUser.initials}</Text>
                                    }
                                </View>
                            </View>
                        )}

                        {!lookupLoading && !isSelfPhone(receiverPhone) && receiverPhone.trim().length >= MIN_PHONE_LOOKUP_LENGTH && !receiverUser && (
                            <View style={[styles.userCard, {backgroundColor: colors.card}]}>
                                <Text style={[styles.userCardNotFoundText, {color: colors.muted}]}>{t('Хэрэглэгч олдсонгүй', 'User not found')}</Text>
                            </View>
                        )}

                        {!initialAmount && (
                            <View style={[styles.inputCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                                <Text style={[styles.amountPrefix, {color: colors.text}]}>{currencySign}</Text>
                                <TextInput
                                    style={[styles.phoneInput, {color: colors.text}]}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.muted}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        <View style={[styles.splitToggleCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                            <Text style={[styles.splitToggleLabel, {color: colors.text}]}>{t('Өөрийгөө оруулах', 'Include myself')}</Text>
                            <Switch
                                value={includeSelf}
                                onValueChange={setIncludeSelf}
                                trackColor={{false: colors.border, true: colors.accent}}
                                thumbColor="#fff"
                            />
                        </View>

                        {perPerson > 0 && (
                            <View style={[styles.perPersonCard, {backgroundColor: colors.accentLight}]}>
                                <Text style={[styles.perPersonLabel, {color: colors.accent}]}>{t('Тус бүрт', 'Per person')}</Text>
                                <Text style={[styles.perPersonAmount, {color: colors.accent}]}>
                                    {perPerson.toLocaleString()} {currencySign}
                                </Text>
                            </View>
                        )}

                        <Text style={[styles.sectionLabel, {color: colors.muted}]}>{t('Нэхэмжлэх хүмүүс', 'Invoice recipients')}</Text>

                        {splitPhones.length > 0 && (
                            <View style={styles.chipsRow}>
                                {splitPhones.map(phone => {
                                    const u = splitUsers[phone];
                                    return (
                                        <View key={phone} style={[styles.phoneChip, {backgroundColor: colors.accentLight}]}>
                                            <View style={[styles.chipAvatar, {backgroundColor: avatarColor(u.phoneNumber, colors)}]}>
                                                {u.profileImageUrl
                                                    ? <Image source={{uri: u.profileImageUrl}} style={styles.chipAvatarImage}/>
                                                    : <Text style={styles.chipAvatarText}>{u.initials}</Text>
                                                }
                                            </View>
                                            <Text style={[styles.phoneChipText, {color: colors.accent}]}>{u.maskedName}</Text>
                                            <TouchableOpacity onPress={() => removeSplitPhone(phone)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                                                <Text style={[styles.phoneChipRemove, {color: colors.accent}]}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        <View style={[styles.inputCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                            <PhoneIcon size={24} color={colors.muted}/>
                            <TextInput
                                style={[styles.phoneInput, {color: colors.text}]}
                                placeholder={t('Утасны дугаар оруулах', 'Enter phone number')}
                                placeholderTextColor={colors.muted}
                                value={splitPhoneInput}
                                onChangeText={handleSplitInputChange}
                                keyboardType="phone-pad"
                            />
                            {splitLookupLoading && <Spinner size="small" color="$blue500"/>}
                        </View>

                        {!splitLookupLoading && isSelfPhone(splitPhoneInput) && splitPhoneInput.trim().length >= MIN_PHONE_LOOKUP_LENGTH && (
                            <View style={[styles.userCard, {backgroundColor: colors.card}]}>
                                <Text style={[styles.userCardNotFoundText, {color: colors.muted}]}>
                                    {t('Өөрийн дугаарт нэхэмжлэх боломжгүй', 'Cannot invoice your own number')}
                                </Text>
                            </View>
                        )}

                        {!splitLookupLoading && !isSelfPhone(splitPhoneInput) && splitLookupUser && (
                            <TouchableOpacity style={[styles.userCard, {backgroundColor: colors.card}]} onPress={selectSplitUser} activeOpacity={0.7}>
                                <View style={{flex: 1}}>
                                    <Text style={[styles.userCardPhone, {color: colors.text}]}>{splitLookupUser.phoneNumber}</Text>
                                    <Text style={[styles.userCardName, {color: colors.muted}]}>{splitLookupUser.maskedName}</Text>
                                </View>
                                <View style={[styles.userAvatar, {backgroundColor: avatarColor(splitLookupUser.phoneNumber, colors)}]}>
                                    {splitLookupUser.profileImageUrl
                                        ? <Image source={{uri: splitLookupUser.profileImageUrl}} style={styles.userAvatarImage}/>
                                        : <Text style={styles.userAvatarText}>{splitLookupUser.initials}</Text>
                                    }
                                </View>
                            </TouchableOpacity>
                        )}

                        {!splitLookupLoading && !isSelfPhone(splitPhoneInput) && splitPhoneInput.trim().length >= MIN_PHONE_LOOKUP_LENGTH && !splitLookupUser && (
                            <View style={[styles.userCard, {backgroundColor: colors.card}]}>
                                <Text style={[styles.userCardNotFoundText, {color: colors.muted}]}>{t('Хэрэглэгч олдсонгүй', 'User not found')}</Text>
                            </View>
                        )}

                        {!canSubmitSplit && (
                            <Text style={[styles.hintText, {color: colors.muted}]}>
                                {t(`Хамгийн багадаа ${MIN_SPLIT_PHONES} хүн сонгоно уу`, `Select at least ${MIN_SPLIT_PHONES} people`)}
                            </Text>
                        )}
                    </>
                )}

                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, {color: colors.muted}]}>{t('Хүлээн авах данс', 'Receive to account')}</Text>
                    {loadingAccounts ? (
                        <View style={styles.centerPad}><Spinner color="$blue500"/></View>
                    ) : myAccounts.length === 0 ? (
                        <View style={[styles.emptyCard, {backgroundColor: colors.card}]}>
                            <Text style={[styles.emptyText, {color: colors.muted}]}>{t('Данс байхгүй байна', 'No accounts found')}</Text>
                        </View>
                    ) : (
                        <AccountCarousel
                            accounts={myAccounts}
                            index={accountIndex}
                            onIndexChange={setAccountIndex}
                            onDragStateChange={setAccountCarouselDragging}
                        />
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, {color: colors.muted}]}>{t('Тайлбар', 'Description')}</Text>
                    <TextInput
                        style={[styles.descInput, {backgroundColor: colors.card, borderColor: colors.border, color: colors.text}]}
                        placeholder={t('Тайлбар', 'Description')}
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
                        {backgroundColor: colors.primary},
                        (sending || (splitMode ? !canSubmitSplit : !canSubmitSingle)) && {backgroundColor: colors.muted},
                    ]}
                    onPress={() => splitMode
                        ? handleSplitSubmit({totalAmount: parsedSplitTotal, peopleCount: participantCount, phones: splitPhones, description})
                        : handleSubmit({receiverPhone, amount, description})
                    }
                    disabled={sending || (splitMode ? !canSubmitSplit : !canSubmitSingle)}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.submitText, {color: colors.textOnPrimary}]}>
                        {sending ? t('Илгээж байна...', 'Sending...') : t('Нэхэмжлэх', 'Invoice')}
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
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
    splitHeroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 16,
        marginBottom: 20,
    },
    splitHeroTitle: {fontSize: 15, fontWeight: '700', marginBottom: 2},
    splitHeroSubtitle: {fontSize: 12},
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 10,
        borderWidth: 1,
    },
    amountPrefix: {fontSize: 18, fontWeight: '700', marginRight: 8},
    phoneInput: {flex: 1, fontSize: 16, paddingVertical: 14},
    splitToggleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        marginBottom: 20,
    },
    splitToggleLabel: {fontSize: 14, fontWeight: '600'},
    perPersonCard: {
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    perPersonLabel: {fontSize: 14, fontWeight: '600'},
    perPersonAmount: {fontSize: 22, fontWeight: '800'},
    section: {marginBottom: 20},
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    centerPad: {paddingVertical: 24, alignItems: 'center'},
    emptyCard: {borderRadius: 12, padding: 16},
    emptyText: {fontSize: 14},
    descInput: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        fontSize: 15,
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
    },
    submitText: {fontWeight: '700', fontSize: 17},
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginTop: 10,
        marginBottom: 10,
        minHeight: 64,
    },
    userCardPhone: {fontSize: 16, fontWeight: '700', marginBottom: 2},
    userCardName: {fontSize: 14},
    userAvatar: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
    },
    userAvatarText: {color: '#fff', fontWeight: '700', fontSize: 16},
    userAvatarImage: {width: 48, height: 48, borderRadius: 24},
    userCardNotFoundText: {fontSize: 14},
    hintText: {fontSize: 12, marginBottom: 12},
    chipsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
    phoneChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingLeft: 4,
        paddingRight: 10,
        paddingVertical: 4,
        gap: 6,
    },
    chipAvatar: {width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
    chipAvatarText: {color: '#fff', fontWeight: '700', fontSize: 10},
    chipAvatarImage: {width: 24, height: 24, borderRadius: 12},
    phoneChipText: {fontWeight: '700', fontSize: 13},
    phoneChipRemove: {fontSize: 13, fontWeight: '700', paddingLeft: 2},
});
