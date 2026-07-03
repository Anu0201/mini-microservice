import {useCallback, useState} from 'react';
import {Alert, FlatList, Modal, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {
    Box,
    Text,
    Button,
    ButtonText,
    Pressable,
    Spinner,
    HStack,
} from '@gluestack-ui/themed';
import {cancelMyInvoice, getMyInvoices, getSentInvoices, payInvoice} from '../api/paymentApi';
import {getMyAccounts} from '../api/accountApi';
import {getMe} from '../api/userApi';

const CURRENCY_BG = {MNT: '#3b82f6', USD: '#16a34a', EUR: '#9333ea'};

function AccountItem({account, selected, onSelect}) {
    const color = CURRENCY_BG[account.currency] ?? '#6b7280';
    return (
        <TouchableOpacity onPress={() => onSelect(account.accountId)} activeOpacity={0.7}>
            <View style={[styles.accountItem, selected && styles.accountItemSelected]}>
                <View style={[styles.currencyBadge, {backgroundColor: color}]}>
                    <Text style={styles.currencyText}>{account.currency}</Text>
                </View>
                <View style={styles.accountInfo}>
                    <Text style={styles.accountNumber}>{account.accountNumber}</Text>
                    <Text style={styles.accountBalance}>
                        {Number(account.balance).toLocaleString()} {account.currency}
                    </Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot}/>}
                </View>
            </View>
        </TouchableOpacity>
    );
}

function PayModal({visible, accounts, loadingAccounts, onClose, onPay}) {
    const [selectedId, setSelectedId] = useState(null);
    const [paying, setPaying] = useState(false);

    const handlePay = async () => {
        if (!selectedId) return;
        setPaying(true);
        await onPay(selectedId);
        setPaying(false);
        setSelectedId(null);
    };

    const handleClose = () => {
        setSelectedId(null);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}/>
            <View style={styles.sheet}>
                <View style={styles.sheetHandle}/>
                <Text style={styles.sheetTitle}>Данс сонгох</Text>
                <Text style={styles.sheetSubtitle}>Аль дансаасаа төлөх вэ?</Text>

                {loadingAccounts ? (
                    <View style={styles.sheetLoading}>
                        <Spinner size="large" color="$blue600"/>
                    </View>
                ) : accounts.length === 0 ? (
                    <View style={styles.sheetLoading}>
                        <Text style={styles.emptyText}>Данс байхгүй байна</Text>
                        <Text style={styles.emptySubText}>"Данс" таб дээр данс нээнэ үү</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.accountList} showsVerticalScrollIndicator={false}>
                        {accounts.map((acc) => (
                            <AccountItem
                                key={acc.accountId}
                                account={acc}
                                selected={selectedId === acc.accountId}
                                onSelect={setSelectedId}
                            />
                        ))}
                    </ScrollView>
                )}

                <View style={styles.sheetButtons}>
                    <TouchableOpacity style={styles.btnCancel} onPress={handleClose}>
                        <Text style={styles.btnCancelText}>Цуцлах</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btnPay, (!selectedId || paying) && styles.btnPayDisabled]}
                        onPress={handlePay}
                        disabled={!selectedId || paying}
                    >
                        <Text style={styles.btnPayText}>
                            {paying ? 'Төлж байна...' : 'Төлөх'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function InvoiceCard({item, onPay, onCancel, isSent}) {
    return (
        <Box bg="$white" mx="$3" mt="$3" borderRadius="$xl" p="$4"
             shadowColor="$black" shadowOpacity={0.05} shadowRadius={4} elevation={1}>
            {isSent ? (
                item.receiverName
                    ? <Text size="sm" color="$gray500" mb="$1">Хүлээн авагч: {item.receiverName}</Text>
                    : null
            ) : (
                item.senderName
                    ? <Text size="sm" color="$gray500" mb="$1">Илгээсэн: {item.senderName}</Text>
                    : null
            )}
            {item.description
                ? <Text size="sm" color="$gray700" mb="$1">{item.description}</Text>
                : null}
            <Text size="xl" fontWeight="$bold" color="$gray900">
                {Number(item.amount).toLocaleString()} {item.currency}
            </Text>
            {item.status === 'UNPAID' && (
                <HStack space="sm" mt="$3">
                    {!isSent && (
                        <Button flex={1} size="sm" bg="$green600" onPress={() => onPay(item.id)}>
                            <ButtonText>Төлөх</ButtonText>
                        </Button>
                    )}
                    <Button flex={1} size="sm" variant="outline" borderColor="$gray300"
                            onPress={() => onCancel(item.id)}>
                        <ButtonText color="$gray500">Цуцлах</ButtonText>
                    </Button>
                </HStack>
            )}
        </Box>
    );
}

export default function InvoiceListScreen({onCompose}) {
    const [tab, setTab] = useState('received');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const [payModalVisible, setPayModalVisible] = useState(false);
    const [payingInvoiceId, setPayingInvoiceId] = useState(null);
    const [payAccounts, setPayAccounts] = useState([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);

    const load = useCallback(async (activeTab) => {
        setLoading(true);
        try {
            const {data} = activeTab === 'received'
                ? await getMyInvoices()
                : await getSentInvoices();
            setInvoices(data);
            setFetched(true);
        } catch {
            Alert.alert('Алдаа', 'Нэхэмжлэл татаж чадсангүй');
        } finally {
            setLoading(false);
        }
    }, []);

    const switchTab = (t) => {
        setTab(t);
        setFetched(false);
        load(t);
    };

    if (!fetched && !loading) load(tab);

    const handlePay = async (invoiceId) => {
        setPayingInvoiceId(invoiceId);
        setPayAccounts([]);
        setPayModalVisible(true);
        setLoadingAccounts(true);
        try {
            const userRes = await getMe();
            const accRes = await getMyAccounts(userRes.data.userId);
            setPayAccounts(accRes.data);
        } catch {
            Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
            setPayModalVisible(false);
        } finally {
            setLoadingAccounts(false);
        }
    };

    const executePay = async (accountId) => {
        try {
            await payInvoice(payingInvoiceId, accountId);
            setPayModalVisible(false);
            setPayingInvoiceId(null);
            load(tab);
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || 'Төлөлт амжилтгүй');
        }
    };

    const handleCancel = (id) => {
        Alert.alert('Цуцлах', 'Нэхэмжлэлийг цуцлах уу?', [
            {text: 'Үгүй'},
            {
                text: 'Тийм', style: 'destructive', onPress: async () => {
                    try {
                        await cancelMyInvoice(id);
                        load(tab);
                    } catch (e) {
                        Alert.alert('Алдаа', e.response?.data?.message || 'Цуцлах амжилтгүй');
                    }
                },
            },
        ]);
    };

    return (
        <Box flex={1} bg="$backgroundLight100">
            <HStack bg="$white" borderBottomWidth={1} borderColor="$gray200">
                {['received', 'sent'].map((t) => (
                    <Pressable key={t} flex={1} py="$3" alignItems="center"
                               borderBottomWidth={2}
                               borderColor={tab === t ? '$blue600' : '$transparent'}
                               onPress={() => switchTab(t)}>
                        <Text size="sm"
                              fontWeight={tab === t ? '$semibold' : '$normal'}
                              color={tab === t ? '$blue600' : '$gray500'}>
                            {t === 'received' ? 'Ирсэн' : 'Илгээсэн'}
                        </Text>
                    </Pressable>
                ))}
            </HStack>

            {loading ? (
                <Box flex={1} alignItems="center" justifyContent="center">
                    <Spinner size="large" color="$blue600"/>
                </Box>
            ) : (
                <FlatList
                    data={invoices}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({item}) => (
                        <InvoiceCard item={item} onPay={handlePay} onCancel={handleCancel} isSent={tab === 'sent'}/>
                    )}
                    ListEmptyComponent={
                        <Box alignItems="center" mt="$12">
                            <Text color="$gray400">Нэхэмжлэл байхгүй байна</Text>
                        </Box>
                    }
                    contentContainerStyle={{paddingBottom: 100}}
                />
            )}

            <Box position="absolute" bottom="$6" right="$4">
                <Button bg="$blue600" borderRadius="$xl" onPress={onCompose}>
                    <ButtonText fontWeight="$bold">Нэхэмжлэх</ButtonText>
                </Button>
            </Box>

            <PayModal
                visible={payModalVisible}
                accounts={payAccounts}
                loadingAccounts={loadingAccounts}
                onClose={() => {
                    setPayModalVisible(false);
                    setPayingInvoiceId(null);
                }}
                onPay={executePay}
            />
        </Box>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        paddingBottom: 32,
        maxHeight: '70%',
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#d1d5db',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    sheetSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 16,
    },
    sheetLoading: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    accountList: {
        marginBottom: 16,
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    accountItemSelected: {
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff',
    },
    currencyBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    currencyText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    accountInfo: {
        flex: 1,
    },
    accountNumber: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    accountBalance: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: '#2563eb',
    },
    radioDot: {
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: '#2563eb',
    },
    sheetButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    btnCancel: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        alignItems: 'center',
    },
    btnCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6b7280',
    },
    btnPay: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#16a34a',
        alignItems: 'center',
    },
    btnPayDisabled: {
        backgroundColor: '#d1d5db',
    },
    btnPayText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    emptyText: {
        fontSize: 15,
        color: '#6b7280',
        marginBottom: 4,
    },
    emptySubText: {
        fontSize: 13,
        color: '#9ca3af',
    },
});