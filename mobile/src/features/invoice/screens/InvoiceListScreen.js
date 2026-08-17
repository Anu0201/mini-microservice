import {useState} from 'react';
import {Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import TransactionDetailScreen from '../../wallet/screens/TransactionDetailScreen';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {CURRENCY_SIGN} from '../../../constants';
import {avatarColor} from '../../../utils/helpers';
import {useInvoiceList} from '../hooks/useInvoiceList';
import PinBottomSheet from '../../../components/PinBottomSheet';
import {useLanguage} from '../../../context/LanguageContext';
import {useTheme} from '../../../context/ThemeContext';

function Avatar({name, initials, imageUrl}) {
    const {colors} = useTheme();
    if (imageUrl) {
        return <Image source={{uri: imageUrl}} style={styles.avatar}/>;
    }
    return (
        <View style={[styles.avatar, {backgroundColor: avatarColor(name, colors)}]}>
            <Text style={styles.avatarText}>{initials ?? '?'}</Text>
        </View>
    );
}

function formatDate(str) {
    if (!str) return '';
    const d = new Date(str);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yy}/${mm}/${dd} ${hh}:${mi}`;
}

function InvoiceRow({item, onSelect}) {
    const {t} = useLanguage();
    const {colors} = useTheme();
    const name = item.senderName || t('Илгээгч', 'Sender');
    const sign = CURRENCY_SIGN[item.currency] ?? item.currency;
    return (
        <TouchableOpacity
            style={[styles.invoiceHighlightRow, {backgroundColor: colors.accentLight, borderColor: colors.border}]}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
        >
            <Avatar name={name} initials={item.senderInitials} imageUrl={item.senderProfileImageUrl}/>
            <View style={styles.txInfo}>
                <Text style={[styles.txName, {color: colors.text}]}>{name}</Text>
                <Text style={[styles.txMeta, {color: colors.muted}]}>{formatDate(item.createdAt)} - SocialPay {t('нэхэмжлэл', 'invoice')}</Text>
                {item.description ? <Text style={[styles.txDesc, {color: colors.muted}]}>{item.description}</Text> : null}
            </View>
            <View style={styles.txRight}>
                <Text style={[styles.invoiceAmount, {color: colors.primary}]}>{Number(item.amount).toLocaleString()}{sign}</Text>
                <Text style={[styles.invoiceChevron, {color: colors.muted}]}>›</Text>
            </View>
        </TouchableOpacity>
    );
}

function InvoiceDetailModal({item, onClose, onPay, onCancel}) {
    const {t} = useLanguage();
    const {colors} = useTheme();
    if (!item) return null;
    const name = item.senderName || t('Илгээгч', 'Sender');
    const sign = CURRENCY_SIGN[item.currency] ?? item.currency;
    return (
        <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}/>
            <View style={[styles.sheet, {backgroundColor: colors.surface}]}>
                <View style={[styles.sheetHandle, {backgroundColor: colors.border}]}/>
                <View style={styles.detailHeader}>
                    <Avatar name={name} initials={item.senderInitials} imageUrl={item.senderProfileImageUrl}/>
                    <View style={{flex: 1, marginLeft: 12}}>
                        <Text style={[styles.detailName, {color: colors.text}]}>{name}</Text>
                        <Text style={[styles.detailMeta, {color: colors.muted}]}>{formatDate(item.createdAt)}</Text>
                    </View>
                </View>
                <Text style={[styles.detailAmount, {color: colors.text}]}>{Number(item.amount).toLocaleString()} {sign}</Text>
                {item.description ? <Text style={[styles.detailDesc, {color: colors.muted}]}>{item.description}</Text> : null}
                <TouchableOpacity
                    style={[styles.detailPayBtn, {backgroundColor: colors.primary}]}
                    onPress={() => { onClose(); onPay(item.id); }}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.btnPayText, {color: colors.textOnPrimary}]}>{t('Төлөх', 'Pay')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnCancelInline} onPress={() => { onClose(); onCancel(item.id); }}>
                    <Text style={[styles.btnCancelText, {color: colors.muted}]}>{t('Цуцлах', 'Cancel')}</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

function PayModal({visible, accounts, loading, onClose, onPay}) {
    const {t} = useLanguage();
    const {colors} = useTheme();
    const [selectedId, setSelectedId] = useState(null);
    const [paying, setPaying] = useState(false);

    const handlePay = async () => {
        if (!selectedId) return;
        setPaying(true);
        await onPay(selectedId);
        setPaying(false);
        setSelectedId(null);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}/>
            <View style={[styles.sheet, {backgroundColor: colors.surface}]}>
                <View style={[styles.sheetHandle, {backgroundColor: colors.border}]}/>
                <Text style={[styles.sheetTitle, {color: colors.text}]}>{t('Данс сонгох', 'Select account')}</Text>
                <Text style={[styles.sheetSub, {color: colors.muted}]}>{t('Аль дансаасаа төлөх вэ?', 'Which account to pay from?')}</Text>
                {loading ? (
                    <View style={styles.sheetCenter}><Spinner size="large" color="$blue500"/></View>
                ) : accounts.length === 0 ? (
                    <View style={styles.sheetCenter}><Text style={[styles.emptyText, {color: colors.muted}]}>{t('Данс байхгүй байна', 'No accounts found')}</Text></View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} style={{marginBottom: 16}}>
                        {accounts.map((acc) => {
                            const active = selectedId === acc.accountId;
                            const sign = CURRENCY_SIGN[acc.currency] ?? acc.currency;
                            return (
                                <TouchableOpacity
                                    key={acc.accountId}
                                    style={[
                                        styles.sheetAccount,
                                        {borderColor: colors.border},
                                        active && {borderColor: colors.primary, backgroundColor: colors.accentLight},
                                    ]}
                                    onPress={() => setSelectedId(acc.accountId)}
                                >
                                    <View style={{flex: 1}}>
                                        <Text style={[styles.accNum, {color: colors.muted}]}>{acc.accountNumber}</Text>
                                        <Text style={[styles.accBal, {color: colors.text}]}>{Number(acc.balance).toLocaleString()} {sign}</Text>
                                    </View>
                                    <View style={[styles.radio, {borderColor: colors.border}, active && {borderColor: colors.primary}]}>
                                        {active && <View style={[styles.radioDot, {backgroundColor: colors.primary}]}/>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
                <View style={styles.sheetBtns}>
                    <TouchableOpacity
                        style={[styles.btnCancel, {borderColor: colors.border}]}
                        onPress={() => { setSelectedId(null); onClose(); }}
                    >
                        <Text style={[styles.btnCancelText, {color: colors.muted}]}>{t('Цуцлах', 'Cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btnPay, {backgroundColor: colors.primary}, (!selectedId || paying) && {backgroundColor: colors.muted}]}
                        onPress={handlePay}
                        disabled={!selectedId || paying}
                    >
                        <Text style={[styles.btnPayText, {color: colors.textOnPrimary}]}>{paying ? t('Төлж байна...', 'Paying...') : t('Төлөх', 'Pay')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function TransactionRow({item, onSelect}) {
    const {t} = useLanguage();
    const {colors} = useTheme();
    const isSent = item._isSent;
    const isPending = isSent && item.status === 'UNPAID';
    const isDeclined = item._isDeclined;
    const name = isSent ? (item.receiverName || t('Хүлээн авагч', 'Receiver')) : (item.senderName || t('Илгээгч', 'Sender'));
    const avatarInitials = isSent ? item.receiverInitials : item.senderInitials;
    const sign = CURRENCY_SIGN[item.currency] ?? item.currency;
    const isInvoice = item.invoiceNumber?.startsWith('INV-');
    const label = isInvoice ? t('нэхэмжлэл', 'invoice') : t('гүйлгээ', 'transaction');
    const prefix = isPending || isDeclined ? ''
        : isSent && isInvoice ? '+'
            : !isSent && isInvoice ? '-'
                : isSent ? '-' : '+';
    const amountColor = isPending || isDeclined ? colors.muted : prefix === '+' ? colors.success : colors.danger;

    return (
        <TouchableOpacity
            style={[styles.txRow, {backgroundColor: colors.background, borderColor: colors.border}]}
            onPress={() => onSelect?.(item)}
            activeOpacity={0.7}
        >
            <Avatar name={name} initials={avatarInitials} imageUrl={isSent ? item.receiverProfileImageUrl : item.senderProfileImageUrl}/>
            <View style={styles.txInfo}>
                <Text style={[styles.txName, {color: isPending || isDeclined ? colors.muted : colors.text}]}>{name}</Text>
                <Text style={[styles.txMeta, {color: colors.muted}]}>{formatDate(item.createdAt)} - SocialPay {label}</Text>
                {item.description ? <Text style={[styles.txDesc, {color: colors.muted}]}>{item.description}</Text> : null}
                {isPending && <Text style={[styles.pendingLabel, {color: colors.muted}]}>{t('Хүлээгдэж байна', 'Pending')}</Text>}
                {isDeclined && <Text style={[styles.declinedLabel, {color: colors.muted}]}>{t('Татгалзсан нэхэмжлэл', 'Declined invoice')}</Text>}
            </View>
            {!isDeclined && (
                <Text style={[styles.txAmount, {color: amountColor}]}>
                    {prefix}{Number(item.amount).toLocaleString()}{sign}
                </Text>
            )}
        </TouchableOpacity>
    );
}

export default function InvoiceListScreen({onBack}) {
    const {t} = useLanguage();
    const {colors} = useTheme();
    const {
        loading, fetched, load,
        pendingInvoices, transactions,
        payModalVisible, payAccounts, loadingAcc,
        handlePay, executePay, handleCancel, closePayModal,
        pinVisible, handlePinConfirm, handlePinClose, registerPaySuccess,
    } = useInvoiceList();

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    if (!fetched && !loading) load();

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, {backgroundColor: colors.background, borderColor: colors.primary}]}>
                    {onBack ? (
                        <TouchableOpacity onPress={onBack} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                            <Text style={[styles.backArrow, {color: colors.primary}]}>‹</Text>
                        </TouchableOpacity>
                    ) : <View style={{width: 32}}/>}
                    <Text style={[styles.headerTitle, {color: colors.primary}]}>{t('Гүйлгээний түүх', 'Transaction History')}</Text>
                    <TouchableOpacity onPress={load} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                        <Text style={[styles.refreshIcon, {color: colors.primary}]}>↻</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {loading ? (
                <View style={styles.center}><Spinner size="large" color="$blue500"/></View>
            ) : (
                <ScrollView style={{backgroundColor: colors.background}} contentContainerStyle={{paddingBottom: 32}}>
                    {pendingInvoices.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, {color: colors.muted, backgroundColor: colors.background}]}>
                                {t('Ирсэн нэхэмжлэл', 'Pending Invoices')}
                            </Text>
                            {pendingInvoices.map((item) => (
                                <InvoiceRow key={item.id} item={item} onSelect={(inv) => setSelectedTransaction({...inv, _isSent: false})}/>
                            ))}
                        </>
                    )}

                    {transactions.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, {color: colors.muted, backgroundColor: colors.background}]}>
                                {t('Гүйлгээ', 'Transactions')}
                            </Text>
                            {transactions.map((item) => (
                                <TransactionRow
                                    key={`${item._isSent ? 's' : 'r'}-${item.id}`}
                                    item={item}
                                    onSelect={setSelectedTransaction}
                                />
                            ))}
                        </>
                    )}

                    {pendingInvoices.length === 0 && transactions.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyStateText, {color: colors.muted}]}>{t('Гүйлгээний түүх байхгүй байна', 'No transaction history')}</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            <Modal visible={!!selectedTransaction} animationType="slide" onRequestClose={() => setSelectedTransaction(null)}>
                {selectedTransaction && (
                    <TransactionDetailScreen
                        item={selectedTransaction}
                        onBack={() => setSelectedTransaction(null)}
                        onCancel={(id) => handleCancel(id, () => {
                            setSelectedTransaction(prev => prev ? {...prev, status: 'CANCELLED', _isDeclined: true} : null);
                        })}
                        onPay={(id) => {
                            registerPaySuccess(() => setSelectedTransaction(null));
                            handlePay(id);
                        }}
                    />
                )}
                <PayModal
                    visible={payModalVisible}
                    accounts={payAccounts}
                    loading={loadingAcc}
                    onClose={closePayModal}
                    onPay={executePay}
                />
                <PinBottomSheet
                    visible={pinVisible}
                    onConfirm={handlePinConfirm}
                    onClose={handlePinClose}
                />
            </Modal>
            <InvoiceDetailModal
                item={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                onPay={handlePay}
                onCancel={handleCancel}
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
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {fontSize: 18, fontWeight: '700'},
    backArrow: {fontSize: 32, lineHeight: 36, width: 32},
    refreshIcon: {fontSize: 22, width: 32, textAlign: 'right'},
    center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    invoiceHighlightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    invoiceAmount: {fontSize: 15, fontWeight: '700'},
    invoiceChevron: {fontSize: 20, marginTop: 4},
    detailHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
    detailName: {fontSize: 17, fontWeight: '700'},
    detailMeta: {fontSize: 12, marginTop: 2},
    detailAmount: {fontSize: 32, fontWeight: '800', marginBottom: 8},
    detailDesc: {fontSize: 14, marginBottom: 20},
    detailPayBtn: {
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 8,
    },
    btnCancelInline: {alignItems: 'center', paddingVertical: 14},
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 46, height: 46, borderRadius: 23,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    avatarText: {color: '#fff', fontWeight: '700', fontSize: 15},
    txInfo: {flex: 1},
    txName: {fontSize: 15, fontWeight: '600', marginBottom: 2},
    txMeta: {fontSize: 12},
    txDesc: {fontSize: 12, marginTop: 2},
    pendingLabel: {fontSize: 11, marginTop: 3},
    txRight: {alignItems: 'flex-end'},
    txAmount: {fontSize: 15, fontWeight: '700'},
    emptyState: {alignItems: 'center', paddingTop: 80},
    emptyStateText: {fontSize: 15},
    backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
    sheet: {
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingBottom: 40, maxHeight: '70%',
    },
    sheetHandle: {
        width: 36, height: 4, borderRadius: 2,
        alignSelf: 'center', marginTop: 12, marginBottom: 20,
    },
    sheetTitle: {fontSize: 18, fontWeight: '700', marginBottom: 4},
    sheetSub: {fontSize: 13, marginBottom: 20},
    sheetCenter: {paddingVertical: 32, alignItems: 'center'},
    sheetAccount: {
        flexDirection: 'row', alignItems: 'center', padding: 14,
        borderRadius: 14, borderWidth: 1.5, marginBottom: 10,
    },
    accNum: {fontSize: 12, marginBottom: 2},
    accBal: {fontSize: 16, fontWeight: '700'},
    radio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    },
    radioDot: {width: 11, height: 11, borderRadius: 6},
    sheetBtns: {flexDirection: 'row', gap: 10},
    btnCancel: {
        flex: 1, paddingVertical: 14, borderRadius: 14,
        borderWidth: 1.5, alignItems: 'center',
    },
    btnCancelText: {fontSize: 15, fontWeight: '600'},
    btnPay: {flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center'},
    btnPayText: {fontSize: 15, fontWeight: '700'},
    emptyText: {fontSize: 14},
    declinedLabel: {fontSize: 11, marginTop: 3, fontWeight: '600'},
});
