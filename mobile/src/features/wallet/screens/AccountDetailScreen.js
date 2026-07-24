import {useEffect, useMemo, useRef} from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    PanResponder,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {COLORS, CURRENCY_BG, CURRENCY_SIGN} from '../../../constants';
import {DepositIcon, WithdrawIcon, BackIcon} from '../../../components/icons';
import {isPrefixCurrency} from '../../../utils/helpers';
import {useAccountDetail} from '../hooks/useAccountDetail';

let LiquidGlassView = null;
let isLiquidGlassSupported = false;
try {
    const liquidGlassModule = require('@callstack/liquid-glass');
    LiquidGlassView = liquidGlassModule.LiquidGlassView;
    isLiquidGlassSupported = liquidGlassModule.isLiquidGlassSupported;
} catch (_) {
}

const GLASS = isLiquidGlassSupported;
const SCREEN_WIDTH = Dimensions.get('window').width;

const TX_LABEL = {
    DEPOSIT: 'Орлого',
    WITHDRAW: 'Зарлага',
    INVOICE_CREDIT: 'SOCIALPAY гүйлгээ',
    INVOICE_DEBIT: 'Нэхэмжлэл гүйлгээ',
};
const TX_SIGN = {DEPOSIT: '+', INVOICE_CREDIT: '+', WITHDRAW: '-', INVOICE_DEBIT: '-'};
const TX_COLOR = {
    DEPOSIT: COLORS.success,
    INVOICE_CREDIT: COLORS.success,
    WITHDRAW: COLORS.danger,
    INVOICE_DEBIT: COLORS.danger,
};

function TxCard({item}) {
    const amountSign = TX_SIGN[item.type] ?? '';
    const color = TX_COLOR[item.type] ?? COLORS.secondary;
    const label = TX_LABEL[item.type] ?? item.type;
    const currencySymbol = CURRENCY_SIGN[item.currency] ?? item.currency ?? '';
    const isPrefix = isPrefixCurrency(item.currency);
    const amountDisplay = isPrefix
        ? `${amountSign}${currencySymbol}${Number(item.amount).toLocaleString()}`
        : `${amountSign}${Number(item.amount).toLocaleString()}${currencySymbol}`;
    const date = item.createdAt
        ? new Date(item.createdAt).toLocaleString('mn-MN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        })
        : '';

    return (
        <View style={styles.txCard}>
            <View style={styles.txLeft}>
                <Text style={styles.txLabel}>{label}</Text>
                {item.description ? <Text style={styles.txDesc}>{item.description}</Text> : null}
                <Text style={styles.txDate}>{date}</Text>
            </View>
            <View style={styles.txRight}>
                <Text style={[styles.txAmount, {color}]}>{amountDisplay}</Text>
                <Text style={styles.txBalance}>{Number(item.balanceAfter).toLocaleString()}</Text>
            </View>
        </View>
    );
}

function BalanceCarousel({accounts, index, onIndexChange, onOpenModal}) {
    const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
    const len = accounts.length;

    useEffect(() => {
        translateX.setValue(-SCREEN_WIDTH);
    }, [index, len]);

    const panResponder = useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
            Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_, g) => {
            translateX.setValue(-SCREEN_WIDTH + g.dx);
        },
        onPanResponderRelease: (_, g) => {
            const DISTANCE_THRESHOLD = SCREEN_WIDTH * 0.25;
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
                    toValue: -SCREEN_WIDTH * 2,
                    duration: 220,
                    useNativeDriver: true,
                }).start(({finished}) => {
                    if (!finished) return;
                    onIndexChange((index + 1) % len);
                    translateX.setValue(-SCREEN_WIDTH);
                });
            } else if (goPrev) {
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 220,
                    useNativeDriver: true,
                }).start(({finished}) => {
                    if (!finished) return;
                    onIndexChange((index - 1 + len) % len);
                    translateX.setValue(-SCREEN_WIDTH);
                });
            } else {
                Animated.spring(translateX, {
                    toValue: -SCREEN_WIDTH,
                    useNativeDriver: true,
                    bounciness: 6,
                }).start();
            }
        },
        onPanResponderTerminate: () => {
            Animated.spring(translateX, {
                toValue: -SCREEN_WIDTH,
                useNativeDriver: true,
                bounciness: 6,
            }).start();
        },
    }), [index, len, onIndexChange, translateX]);

    if (len === 0) return null;

    const prevAccount = accounts[(index - 1 + len) % len];
    const currentAccount = accounts[index];
    const nextAccount = accounts[(index + 1) % len];

    const renderBalance = (account, key) => {
        const currencySymbol = CURRENCY_SIGN[account.currency] ?? account.currency;
        const isPrefix = isPrefixCurrency(account.currency);
        const balanceDisplay = isPrefix
            ? `${currencySymbol} ${Number(account.balance).toLocaleString()}`
            : `${Number(account.balance).toLocaleString()} ${currencySymbol}`;

        return (
            <View key={key} style={[styles.balanceArea, {width: SCREEN_WIDTH}]}>
                <View style={[styles.currencyTag, {backgroundColor: CURRENCY_BG[account.currency] ?? COLORS.primary}]}>
                    <Text style={styles.currencyTagText}>{account.currency}</Text>
                </View>
                <Text style={styles.accountNumber}>{account.accountNumber}</Text>
                <Text style={styles.balanceText}>{balanceDisplay}</Text>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onOpenModal('deposit')}
                        activeOpacity={0.85}
                    >
                        <DepositIcon size={20} color={COLORS.primary}/>
                        <Text style={styles.actionBtnText}>Орлого</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnOutline]}
                        onPress={() => onOpenModal('withdraw')}
                        activeOpacity={0.85}
                    >
                        <WithdrawIcon size={20} color="#fff"/>
                        <Text style={[styles.actionBtnText, styles.actionBtnTextOutline]}>
                            Зарлага
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.carouselViewport} {...panResponder.panHandlers}>
            <Animated.View style={[styles.carouselTrack, {transform: [{translateX}]}]}>
                {renderBalance(prevAccount, 'prev')}
                {renderBalance(currentAccount, 'current')}
                {renderBalance(nextAccount, 'next')}
            </Animated.View>
        </View>
    );
}

export default function AccountDetailScreen({accountId, onBack}) {
    const insets = useSafeAreaInsets();
    const {
        account, accounts, activeIndex, goToIndex,
        transactions, loading, transactionsLoading,
        modal, setModal, amount, setAmount, txLoading,
        openModal, handleTransaction,
    } = useAccountDetail(accountId);

    const headerContent = (
        <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
                <BackIcon size={20} color={GLASS ? 'rgba(255,255,255,0.9)' : '#fff'}/>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, GLASS && styles.headerTitleGlass]}>
                Дансны мэдээлэл
            </Text>
            <View style={styles.backBtn}/>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, {paddingTop: insets.top}]}>
                           {GLASS ? (
                               <LiquidGlassView style={styles.glassNav} effect="regular" colorScheme="system">
                                   {headerContent}
                               </LiquidGlassView>
                           ) : (
                               headerContent
                           )}

                               {loading || !account ? (
                                   <View style={styles.balancePlaceholder}>
                                       <Spinner size="large" color="#fff"/>
                                   </View>
                               ) : (
                                   <BalanceCarousel
                                       accounts={accounts}
                                       index={activeIndex}
                                       onIndexChange={goToIndex}
                                       onOpenModal={openModal}
                                   />
                               )}
            </View>

            {loading || !account ? (
                <View style={styles.center}>
                    <Spinner size="large" color={COLORS.primary}/>
                </View>
            ) : (
                <>
                    <Text style={styles.sectionLabel}>ГҮЙЛГЭЭНИЙ ТҮҮХ</Text>
                    {transactionsLoading ? (
                        <View style={styles.center}>
                            <Spinner size="small" color={COLORS.primary}/>
                        </View>
                    ) : (
                        <FlatList
                            data={transactions}
                            keyExtractor={(item) => String(item.transactionId)}
                            renderItem={({item}) => <TxCard item={item}/>}
                            ListEmptyComponent={
                                <View style={styles.emptyWrap}>
                                    <Text style={styles.emptyText}>Гүйлгээний түүх байхгүй байна</Text>
                                </View>
                            }
                            contentContainerStyle={{paddingBottom: 24}}
                        />
                    )}
                </>
            )}

            <Modal
                visible={!!modal}
                transparent
                animationType="fade"
                onRequestClose={() => setModal(null)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>
                            {modal === 'deposit' ? 'Орлого оруулах' : 'Зарлага гаргах'}
                        </Text>
                        <Text style={styles.modalLabel}>Дүн ({account?.currency})</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="0.00"
                            placeholderTextColor={COLORS.muted}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            autoFocus
                        />
                        {account && (
                            <Text style={styles.modalHint}>
                                Үлдэгдэл: {Number(account.balance).toLocaleString()} {account.currency}
                            </Text>
                        )}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setModal(null)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.cancelBtnText}>Цуцлах</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.confirmBtn,
                                    {backgroundColor: modal === 'deposit' ? COLORS.success : COLORS.primary},
                                    txLoading && styles.disabledBtn,
                                ]}
                                onPress={handleTransaction}
                                disabled={txLoading}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.confirmBtnText}>
                                    {txLoading ? 'Хүлээнэ үү...' : 'Батлах'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f8fafc'},

    header: {backgroundColor: COLORS.primary, paddingBottom: 28},
    glassNav: {marginHorizontal: 12, marginTop: 8, borderRadius: 16, overflow: 'hidden'},
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
    headerTitle: {fontSize: 17, fontWeight: '700', color: '#fff'},
    headerTitleGlass: {color: 'rgba(255,255,255,0.95)'},

    carouselViewport: {overflow: 'hidden', width: SCREEN_WIDTH},
    carouselTrack: {flexDirection: 'row'},

    balancePlaceholder: {height: 220, alignItems: 'center', justifyContent: 'center'},
    balanceArea: {alignItems: 'center', paddingHorizontal: 20, paddingTop: 8},
    currencyTag: {
        paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: 12, marginBottom: 8,
    },
    currencyTagText: {color: '#fff', fontSize: 12, fontWeight: '700'},
    accountNumber: {fontSize: 14, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 8},
    balanceText: {fontSize: 40, fontWeight: '800', color: '#fff', marginBottom: 20},

    actionRow: {flexDirection: 'row', gap: 12, width: '100%'},
    actionBtn: {
        flex: 1, height: 46, borderRadius: 23,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        gap: 6,
    },
    actionBtnOutline: {backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)'},
    actionBtnText: {fontSize: 15, fontWeight: '700', color: COLORS.primary},
    actionBtnTextOutline: {color: '#fff'},

    center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    sectionLabel: {
        fontSize: 11, fontWeight: '700', color: COLORS.muted,
        letterSpacing: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
    },

    txCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginTop: 8,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    txLeft: {flex: 1, marginRight: 12},
    txLabel: {fontSize: 14, fontWeight: '600', color: '#0f172a'},
    txDesc: {fontSize: 12, color: COLORS.secondary, marginTop: 1},
    txDate: {fontSize: 11, color: COLORS.muted, marginTop: 2},
    txRight: {alignItems: 'flex-end'},
    txAmount: {fontSize: 16, fontWeight: '700'},
    txBalance: {fontSize: 11, color: COLORS.muted, marginTop: 2},

    emptyWrap: {alignItems: 'center', marginTop: 48},
    emptyText: {color: COLORS.muted, fontSize: 14},

    modalBackdrop: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center', justifyContent: 'center',
    },
    modalBox: {
        width: '88%', backgroundColor: '#fff',
        borderRadius: 24, padding: 24,
    },
    modalTitle: {fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16},
    modalLabel: {fontSize: 13, color: COLORS.secondary, marginBottom: 6},
    modalInput: {
        borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 18, color: '#0f172a', marginBottom: 8,
    },
    modalHint: {fontSize: 12, color: COLORS.muted, marginBottom: 20},
    modalActions: {flexDirection: 'row', gap: 10},
    cancelBtn: {
        flex: 1, height: 48, borderRadius: 24,
        borderWidth: 1.5, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
    },
    cancelBtnText: {fontSize: 15, fontWeight: '600', color: COLORS.secondary},
    confirmBtn: {
        flex: 1, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
    },
    confirmBtnText: {fontSize: 15, fontWeight: '700', color: '#fff'},
    disabledBtn: {opacity: 0.6},
})