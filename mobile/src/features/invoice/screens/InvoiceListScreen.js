import {useState} from 'react';
import {Modal, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {CURRENCY_SIGN} from '../../../constants';
import {initials, avatarColor} from '../../../utils/helpers';
import {useInvoiceList} from '../hooks/useInvoiceList';

function Avatar({name}) {
    return (
        <View style={[styles.avatar, {backgroundColor: avatarColor(name)}]}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
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
    const name = item.senderName || 'Илгээгч';
    const sign = CURRENCY_SIGN[item.currency] ?? item.currency;
    return (
        <TouchableOpacity style={styles.invoiceHighlightRow} onPress={() => onSelect(item)} activeOpacity={0.7}>
            <Avatar name={name}/>
            <View style={styles.txInfo}>
                <Text style={styles.txName}>{name}</Text>
                <Text style={styles.txMeta}>{formatDate(item.createdAt)} - SocialPay нэхэмжлэл</Text>
                {item.description ? <Text style={styles.txDesc}>{item.description}</Text> : null}
            </View>
            <View style={styles.txRight}>
                <Text style={styles.invoiceAmount}>{Number(item.amount).toLocaleString()}{sign}</Text>
                <Text style={styles.invoiceChevron}>›</Text>
            </View>
        </TouchableOpacity>
    );
}

function InvoiceDetailModal({item, onClose, onPay, onCancel}) {
    if (!item) return null;
    const name = item.senderName || 'Илгээгч';
    const sign = CURRENCY_SIGN[item.currency] ?? item.currency;
    return (
        <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}/>
            <View style={styles.sheet}>
                <View style={styles.sheetHandle}/>
                <View style={styles.detailHeader}>
                    <Avatar name={name}/>
                    <View style={{flex: 1, marginLeft: 12}}>
                        <Text style={styles.detailName}>{name}</Text>
                        <Text style={styles.detailMeta}>{formatDate(item.createdAt)}</Text>
                    </View>
                </View>
                <Text style={styles.detailAmount}>{Number(item.amount).toLocaleString()} {sign}</Text>
                {item.description ? <Text style={styles.detailDesc}>{item.description}</Text> : null}
                <TouchableOpacity
                    style={styles.detailPayBtn}
                    onPress={() => {
                        onClose();
                        onPay(item.id);
                    }}
                    activeOpacity={0.85}
                >
                    <Text style={styles.btnPayText}>Төлөх</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnCancelInline} onPress={() => {
                    onClose();
                    onCancel(item.id);
                }}>
                    <Text style={styles.btnCancelText}>Цуцлах</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

function PayModal({visible, accounts, loading, onClose, onPay}) {
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
            <View style={styles.sheet}>
                <View style={styles.sheetHandle}/>
                <Text style={styles.sheetTitle}>Данс сонгох</Text>
                <Text style={styles.sheetSub}>Аль дансаасаа төлөх вэ?</Text>
                {loading ? (
                    <View style={styles.sheetCenter}><Spinner size="large" color="$blue500"/></View>
                ) : accounts.length === 0 ? (
                    <View style={styles.sheetCenter}><Text style={styles.emptyText}>Данс байхгүй байна</Text></View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} style={{marginBottom: 16}}>
                        {accounts.map((acc) => {
                            const active = selectedId === acc.accountId;
                            const sign = CURRENCY_SIGN[acc.currency] ?? acc.currency;
                            return (
                                <TouchableOpacity
                                    key={acc.accountId}
                                    style={[styles.sheetAccount, active && styles.sheetAccountActive]}
                                    onPress={() => setSelectedId(acc.accountId)}
                                >
                                    <View style={{flex: 1}}>
                                        <Text style={styles.accNum}>{acc.accountNumber}</Text>
                                        <Text style={styles.accBal}>{Number(acc.balance).toLocaleString()} {sign}</Text>
                                    </View>
                                    <View style={[styles.radio, active && styles.radioActive]}>
                                        {active && <View style={styles.radioDot}/>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
                <View style={styles.sheetBtns}>
                    <TouchableOpacity style={styles.btnCancel} onPress={() => {
                        setSelectedId(null);
                        onClose();
                    }}>
                        <Text style={styles.btnCancelText}>Цуцлах</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btnPay, (!selectedId || paying) && styles.btnDisabled]}
                        onPress={handlePay}
                        disabled={!selectedId || paying}
                    >
                        <Text style={styles.btnPayText}>{paying ? 'Төлж байна...' : 'Төлөх'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function TransactionRow({item}) {
    const isSent = item._isSent;
    const isPending = isSent && item.status === 'UNPAID';
    const isDeclined = item._isDeclined; // hook-с шууд авна
    const name = isSent ? (item.receiverName || 'Хүлээн авагч') : (item.senderName || 'Илгээгч');
    const sign = CURRENCY_SIGN[item.currency] ?? item.currency;
    const isInvoice = item.invoiceNumber?.startsWith('INV-');
    const label = isInvoice ? 'нэхэмжлэл' : 'гүйлгээ';
    const prefix = isPending || isDeclined ? ''
        : isSent && isInvoice ? '+'
            : !isSent && isInvoice ? '-'
                : isSent ? '-' : '+';
    const color = isPending || isDeclined ? '#94a3b8' : prefix === '+' ? '#16a34a' : '#ef4444';

    return (
        <View style={styles.txRow}>
            <Avatar name={name}/>
            <View style={styles.txInfo}>
                <Text style={[styles.txName, (isPending || isDeclined) && styles.txNameMuted]}>{name}</Text>
                <Text style={styles.txMeta}>{formatDate(item.createdAt)} - SocialPay {label}</Text>
                {item.description ? <Text style={styles.txDesc}>{item.description}</Text> : null}
                {isPending && <Text style={styles.pendingLabel}>Хүлээгдэж байна</Text>}
                {isDeclined && <Text style={styles.declinedLabel}>Татгалзсан нэхэмжлэл</Text>}
            </View>
            {!isDeclined && (
                <Text style={[styles.txAmount, {color}]}>
                    {prefix}{Number(item.amount).toLocaleString()}{sign}
                </Text>
            )}
        </View>
    );
}

export default function InvoiceListScreen({onBack}) {
    const {
        loading, fetched, load,
        pendingInvoices, transactions,
        payModalVisible, payAccounts, loadingAcc,
        handlePay, executePay, handleCancel, closePayModal,
    } = useInvoiceList();

    const [selectedInvoice, setSelectedInvoice] = useState(null);

    if (!fetched && !loading) load();

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    {onBack ? (
                        <TouchableOpacity onPress={onBack} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                            <Text style={styles.backArrow}>‹</Text>
                        </TouchableOpacity>
                    ) : <View style={{width: 32}}/>}
                    <Text style={styles.headerTitle}>Гүйлгээний түүх</Text>
                    <TouchableOpacity onPress={load} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                        <Text style={styles.refreshIcon}>↻</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {loading ? (
                <View style={styles.center}><Spinner size="large" color="$blue500"/></View>
            ) : (
                <ScrollView contentContainerStyle={{paddingBottom: 32}}>

                    {pendingInvoices.length > 0 && (
                        <>
                            <Text style={styles.sectionLabel}>Ирсэн нэхэмжлэл</Text>
                            {pendingInvoices.map((item) => (
                                <InvoiceRow key={item.id} item={item} onSelect={setSelectedInvoice}/>
                            ))}
                        </>
                    )}

                    {transactions.length > 0 && (
                        <>
                            <Text style={styles.sectionLabel}>Гүйлгээ</Text>
                            {transactions.map((item) => (
                                <TransactionRow key={`${item._isSent ? 's' : 'r'}-${item.id}`} item={item}/>
                            ))}
                        </>
                    )}

                    {pendingInvoices.length === 0 && transactions.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>Гүйлгээний түүх байхгүй байна</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            <InvoiceDetailModal
                item={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                onPay={handlePay}
                onCancel={handleCancel}
            />
            <PayModal
                visible={payModalVisible}
                accounts={payAccounts}
                loading={loadingAcc}
                onClose={closePayModal}
                onPay={executePay}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f8fafc'},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    headerTitle: {fontSize: 18, fontWeight: '700', color: '#0f172a'},
    backArrow: {fontSize: 32, color: '#0f172a', lineHeight: 36, width: 32},
    refreshIcon: {fontSize: 22, color: '#0891b2', width: 32, textAlign: 'right'},
    center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#f8fafc',
    },
    invoiceHighlightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: '#fef3c7',
    },
    invoiceAmount: {fontSize: 15, fontWeight: '700', color: '#d97706'},
    invoiceChevron: {fontSize: 20, color: '#cbd5e1', marginTop: 4},
    detailHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
    detailName: {fontSize: 17, fontWeight: '700', color: '#0f172a'},
    detailMeta: {fontSize: 12, color: '#94a3b8', marginTop: 2},
    detailAmount: {fontSize: 32, fontWeight: '800', color: '#0f172a', marginBottom: 8},
    detailDesc: {fontSize: 14, color: '#64748b', marginBottom: 20},
    detailPayBtn: {
        backgroundColor: '#0891b2',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 8
    },
    btnCancelInline: {alignItems: 'center', paddingVertical: 14},
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    avatar: {
        width: 46, height: 46, borderRadius: 23,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    avatarText: {color: '#fff', fontWeight: '700', fontSize: 15},
    txInfo: {flex: 1},
    txName: {fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 2},
    txMeta: {fontSize: 12, color: '#94a3b8'},
    txDesc: {fontSize: 12, color: '#64748b', marginTop: 2},
    txNameMuted: {color: '#94a3b8'},
    pendingLabel: {fontSize: 11, color: '#94a3b8', marginTop: 3},
    txRight: {alignItems: 'flex-end'},
    txAmount: {fontSize: 15, fontWeight: '700'},
    emptyState: {alignItems: 'center', paddingTop: 80},
    emptyStateText: {color: '#94a3b8', fontSize: 15},
    backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
    sheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingBottom: 40, maxHeight: '70%',
    },
    sheetHandle: {
        width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2,
        alignSelf: 'center', marginTop: 12, marginBottom: 20,
    },
    sheetTitle: {fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 4},
    sheetSub: {fontSize: 13, color: '#94a3b8', marginBottom: 20},
    sheetCenter: {paddingVertical: 32, alignItems: 'center'},
    sheetAccount: {
        flexDirection: 'row', alignItems: 'center', padding: 14,
        borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', marginBottom: 10,
    },
    sheetAccountActive: {borderColor: '#0891b2', backgroundColor: '#f0f9ff'},
    accNum: {fontSize: 12, color: '#94a3b8', marginBottom: 2},
    accBal: {fontSize: 16, fontWeight: '700', color: '#0f172a'},
    radio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center',
    },
    radioActive: {borderColor: '#0891b2'},
    radioDot: {width: 11, height: 11, borderRadius: 6, backgroundColor: '#0891b2'},
    sheetBtns: {flexDirection: 'row', gap: 10},
    btnCancel: {
        flex: 1, paddingVertical: 14, borderRadius: 14,
        borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center',
    },
    btnCancelText: {fontSize: 15, fontWeight: '600', color: '#64748b'},
    btnPay: {flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#0891b2', alignItems: 'center'},
    btnDisabled: {backgroundColor: '#cbd5e1'},
    btnPayText: {fontSize: 15, fontWeight: '700', color: '#fff'},
    emptyText: {fontSize: 14, color: '#94a3b8'},
    declinedLabel: {fontSize: 11, color: '#64748b', marginTop: 3, fontWeight: '600'},
});