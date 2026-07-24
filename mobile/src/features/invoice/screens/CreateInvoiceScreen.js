import {useEffect, useRef, useState} from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
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

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 40;
const MIN_SPLIT_PHONES = 2;

const normalizePhone = (phone) => String(phone ?? '').replace(/\D/g, '');

function AccountCarousel({accounts, index, onIndexChange, onDragStateChange}) {
    const translateX = useRef(new Animated.Value(-CARD_WIDTH)).current;
    const len = accounts.length;

    useEffect(() => {
        translateX.setValue(-CARD_WIDTH);
    }, [index, len]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
            onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
            onPanResponderGrant: () => {
                onDragStateChange?.(true);
            },
            onPanResponderMove: (_, g) => {
                translateX.setValue(-CARD_WIDTH + g.dx);
            },
            onPanResponderRelease: (_, g) => {
                onDragStateChange?.(false);
                const DISTANCE_THRESHOLD = CARD_WIDTH * 0.4;
                const VELOCITY_THRESHOLD = 0.35;
                const MIN_FLICK_DISTANCE = 24;

                const goNext = len > 1 && (
                    g.dx <= -DISTANCE_THRESHOLD ||
                    (g.dx <= -MIN_FLICK_DISTANCE && g.vx <= -VELOCITY_THRESHOLD)
                );
                const goPrev = len > 1 && (
                    g.dx >= DISTANCE_THRESHOLD ||
                    (g.dx >= MIN_FLICK_DISTANCE && g.vx >= VELOCITY_THRESHOLD)
                );

                if (goNext) {
                    Animated.timing(translateX, {
                        toValue: -CARD_WIDTH * 2,
                        duration: 220,
                        useNativeDriver: true,
                    }).start(() => {
                        onIndexChange((index + 1) % len);
                        translateX.setValue(-CARD_WIDTH);
                    });
                } else if (goPrev) {
                    Animated.timing(translateX, {
                        toValue: 0,
                        duration: 220,
                        useNativeDriver: true,
                    }).start(() => {
                        onIndexChange((index - 1 + len) % len);
                        translateX.setValue(-CARD_WIDTH);
                    });
                } else {
                    Animated.spring(translateX, {
                        toValue: -CARD_WIDTH,
                        useNativeDriver: true,
                        bounciness: 6,
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                onDragStateChange?.(false);
                Animated.spring(translateX, {
                    toValue: -CARD_WIDTH,
                    useNativeDriver: true,
                    bounciness: 6,
                }).start();
            },
        })
    ).current;

    if (len === 0) return null;

    const prevAccount = accounts[(index - 1 + len) % len];
    const currentAccount = accounts[index];
    const nextAccount = accounts[(index + 1) % len];

    const renderCard = (account, key) => {
        const currencySymbol = CURRENCY_SIGN[account.currency] ?? account.currency;
        return (
            <View key={key} style={[styles.accountCard, {width: CARD_WIDTH}]}>
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
            </View>
        );
    };

    return (
        <View>
            <View style={[styles.carouselViewport, {width: CARD_WIDTH}]} {...panResponder.panHandlers}>
                <Animated.View style={[styles.carouselTrack, {transform: [{translateX}]}]}>
                    {renderCard(prevAccount, 'prev')}
                    {renderCard(currentAccount, 'current')}
                    {renderCard(nextAccount, 'next')}
                </Animated.View>
            </View>
            {len > 1 && (
                <View style={styles.dotsRow}>
                    {accounts.map((_, i) => (
                        <View key={i} style={[styles.dot, i === index && styles.dotActive]}/>
                    ))}
                </View>
            )}
        </View>
    );
}

export default function CreateInvoiceScreen({onBack, onSuccess, currency = 'MNT', initialAmount = ''}) {
    const {
        myAccounts, selectedAccountId, setSelectedAccountId, loadingAccounts, sending, handleSubmit, handleSplitSubmit,
        receiverUser, lookupLoading, lookupPhone,
        currentUserPhone
    } = useCreateInvoice({currency, initialAmount, onSuccess});

    const isSelfPhone = (phone) => {
        const norm = normalizePhone(phone);
        return norm.length > 0 && norm === normalizePhone(currentUserPhone);
    };

    const [receiverPhone, setReceiverPhone] = useState('');
    const handlePhoneChange = (text) => {
        setReceiverPhone(text);
        if (isSelfPhone(text.trim())) {
            return;
        }
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
        if (phone.length < MIN_PHONE_LOOKUP_LENGTH) {
            setSplitLookupLoading(false);
            return;
        }
        if (isSelfPhone(phone)) {
            setSplitLookupLoading(false);
            return;
        }
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
        setSplitUsers(prev => {
            const next = {...prev};
            delete next[phone];
            return next;
        });
    };
    const displayAmount = initialAmount > 0 ? Number(initialAmount).toLocaleString() : (amount || '0');

    const canSubmitSingle = receiverPhone.trim().length > 0 && !isSelfPhone(receiverPhone);

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                        <Text style={styles.backArrow}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {splitMode
                            ? `${displayAmount} ${currencySign} хуваалцах`
                            : `${displayAmount} ${currencySign} нэхэмжлэх`}
                    </Text>
                    <View style={{width: 32}}/>
                </View>
            </SafeAreaView>

            <ScrollView
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={!accountCarouselDragging}
            >

                <View style={styles.splitHeroCard}>
                    <View style={{flex: 1}}>
                        <Text style={styles.splitHeroTitle}>Хэсэгчлэн хуваалцах</Text>
                        <Text style={styles.splitHeroSubtitle}>
                            Нийт дүнг олон хүнд хуваан нэхэмжлэх
                        </Text>
                    </View>
                    <Switch
                        value={splitMode}
                        onValueChange={handleToggleSplit}
                        trackColor={{false: '#e2e8f0', true: COLORS.accent}}
                        thumbColor="#fff"
                    />
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

                        {isSelfPhone(receiverPhone) && receiverPhone.trim().length >= MIN_PHONE_LOOKUP_LENGTH && (
                            <View style={[styles.userCard, styles.userCardNotFound]}>
                                <Text style={styles.userCardNotFoundText}>
                                    Өөрийн дугаарт нэхэмжлэх боломжгүй
                                </Text>
                            </View>
                        )}

                        {!lookupLoading && !isSelfPhone(receiverPhone) && receiverUser && (
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

                        {!lookupLoading && !isSelfPhone(receiverPhone) && receiverPhone.trim().length >= MIN_PHONE_LOOKUP_LENGTH && !receiverUser && (
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
                        <View style={styles.splitToggleCard}>
                            <Text style={styles.splitToggleLabel}>Өөрийгөө оруулах</Text>
                            <Switch
                                value={includeSelf}
                                onValueChange={setIncludeSelf}
                                trackColor={{false: '#e2e8f0', true: COLORS.accent}}
                                thumbColor="#fff"
                            />
                        </View>

                        {perPerson > 0 && (
                            <View style={styles.perPersonCard}>
                                <Text style={styles.perPersonLabel}>Тус бүрт</Text>
                                <Text style={styles.perPersonAmount}>
                                    {perPerson.toLocaleString()} {currencySign}
                                </Text>
                            </View>
                        )}

                        <Text style={styles.sectionLabel}>Нэхэмжлэх хүмүүс</Text>

                        {splitPhones.length > 0 && (
                            <View style={styles.chipsRow}>
                                {splitPhones.map(phone => {
                                    const u = splitUsers[phone];
                                    return (
                                        <View key={phone} style={styles.phoneChip}>
                                            <View
                                                style={[styles.chipAvatar, {backgroundColor: avatarColor(u.username)}]}>
                                                <Text style={styles.chipAvatarText}>{initials(u.username)}</Text>
                                            </View>
                                            <Text style={styles.phoneChipText}>{maskName(u.username)}</Text>
                                            <TouchableOpacity
                                                onPress={() => removeSplitPhone(phone)}
                                                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                                            >
                                                <Text style={styles.phoneChipRemove}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        <View style={styles.inputCard}>
                            <PhoneIcon size={24} color={COLORS.muted}/>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="Утасны дугаар оруулах"
                                placeholderTextColor={COLORS.muted}
                                value={splitPhoneInput}
                                onChangeText={handleSplitInputChange}
                                keyboardType="phone-pad"
                            />
                            {splitLookupLoading && <Spinner size="small" color={COLORS.accent}/>}
                        </View>

                        {!splitLookupLoading && isSelfPhone(splitPhoneInput) && splitPhoneInput.trim().length >= MIN_PHONE_LOOKUP_LENGTH && (
                            <View style={[styles.userCard, styles.userCardNotFound]}>
                                <Text style={styles.userCardNotFoundText}>
                                    Өөрийн дугаарт нэхэмжлэх боломжгүй
                                </Text>
                            </View>
                        )}

                        {!splitLookupLoading && !isSelfPhone(splitPhoneInput) && splitLookupUser && (
                            <TouchableOpacity style={styles.userCard} onPress={selectSplitUser} activeOpacity={0.7}>
                                <View style={{flex: 1}}>
                                    <Text style={styles.userCardPhone}>{splitLookupUser.phoneNumber}</Text>
                                    <Text style={styles.userCardName}>{maskName(splitLookupUser.username)}</Text>
                                </View>
                                <View
                                    style={[styles.userAvatar, {backgroundColor: avatarColor(splitLookupUser.username)}]}>
                                    <Text style={styles.userAvatarText}>{initials(splitLookupUser.username)}</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        {!splitLookupLoading && !isSelfPhone(splitPhoneInput) && splitPhoneInput.trim().length >= MIN_PHONE_LOOKUP_LENGTH && !splitLookupUser && (
                            <View style={[styles.userCard, styles.userCardNotFound]}>
                                <Text style={styles.userCardNotFoundText}>Хэрэглэгч олдсонгүй</Text>
                            </View>
                        )}

                        {!canSubmitSplit && (
                            <Text style={styles.hintText}>
                                Хамгийн багадаа {MIN_SPLIT_PHONES} хүн сонгоно уу
                            </Text>
                        )}
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
                        <AccountCarousel
                            accounts={myAccounts}
                            index={accountIndex}
                            onIndexChange={setAccountIndex}
                            onDragStateChange={setAccountCarouselDragging}
                        />
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
                    style={[
                        styles.submitBtn,
                        (sending || (splitMode ? !canSubmitSplit : !canSubmitSingle)) && styles.submitDisabled
                    ]}
                    onPress={() => splitMode
                        ? handleSplitSubmit({
                            totalAmount: parsedSplitTotal,
                            peopleCount: participantCount,
                            phones: splitPhones,
                            description
                        })
                        : handleSubmit({receiverPhone, amount, description})
                    }
                    disabled={sending || (splitMode ? !canSubmitSplit : !canSubmitSingle)}
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
    splitHeroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.accentLight,
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 16,
        marginBottom: 20,
    },
    splitHeroTitle: {fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2},
    splitHeroSubtitle: {fontSize: 12, color: COLORS.secondary},
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    amountPrefix: {fontSize: 18, fontWeight: '700', color: '#0f172a', marginRight: 8},
    phoneInput: {flex: 1, fontSize: 16, color: '#0f172a', paddingVertical: 14},
    splitToggleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
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
    carouselViewport: {overflow: 'hidden', alignSelf: 'center'},
    carouselTrack: {flexDirection: 'row'},
    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.accent,
        backgroundColor: COLORS.accentLight,
    },
    badge: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12},
    badgeText: {color: '#fff', fontWeight: '700', fontSize: 11},
    accNum: {fontSize: 12, color: COLORS.muted, marginBottom: 2},
    accBal: {fontSize: 16, fontWeight: '700', color: '#0f172a'},
    dotsRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 6},
    dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1'},
    dotActive: {width: 16, borderRadius: 3, backgroundColor: COLORS.accent},
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
        marginTop: 10,
        marginBottom: 10,
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
    hintText: {color: COLORS.muted, fontSize: 12, marginBottom: 12},

    chipsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
    phoneChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0f2fe',
        borderRadius: 20,
        paddingLeft: 4,
        paddingRight: 10,
        paddingVertical: 4,
        gap: 6,
    },
    chipAvatar: {width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
    chipAvatarText: {color: '#fff', fontWeight: '700', fontSize: 10},
    phoneChipText: {color: COLORS.accent, fontWeight: '700', fontSize: 13},
    phoneChipRemove: {color: COLORS.accent, fontSize: 13, fontWeight: '700', paddingLeft: 2},
    selectHint: {color: COLORS.accent, fontWeight: '700', fontSize: 13, marginLeft: 8},
});