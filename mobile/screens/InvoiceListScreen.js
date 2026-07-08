import { useCallback, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spinner, Text } from '@gluestack-ui/themed';
import {CURRENCY_SIGN} from '../constants';
import { cancelMyInvoice, getMyInvoices, getSentInvoices, payInvoice } from '../api/paymentApi';
import { getMyAccounts } from '../api/accountApi';
import { getMe } from '../api/userApi';
import { initials } from '../utils/helpers';
}

function Avatar({ name }) {
  const colors = ['#7c3aed', '#0891b2', '#16a34a', '#dc2626', '#d97706', '#0284c7'];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <View style={[styles.avatar, { backgroundColor: colors[idx] }]}>
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

function InvoiceRow({ item, onPay, onCancel }) {
  const name = item.senderName || 'Илгээгч';
  const sign = CURRENCY_SIGN[item.currency] ?? item.currency;
  return (
    <View style={styles.invoiceHighlightRow}>
      <Avatar name={name} />
      <View style={styles.txInfo}>
        <Text style={styles.txName}>{name}</Text>
        <Text style={styles.txMeta}>{formatDate(item.createdAt)} - SocialPay нэхэмжлэл</Text>
        {item.description ? <Text style={styles.txDesc}>{item.description}</Text> : null}
      </View>
      <View style={styles.txRight}>
        <Text style={styles.invoiceAmount}>{Number(item.amount).toLocaleString()}{sign}</Text>
        <View style={styles.invoiceActions}>
          <TouchableOpacity style={styles.payChip} onPress={() => onPay(item.id)}>
            <Text style={styles.payChipText}>Төлөх</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onCancel(item.id)}>
            <Text style={styles.cancelLink}>Цуцлах</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function TransactionRow({ item }) {
  const isSent = item._isSent;
  const name   = isSent ? (item.receiverName || 'Хүлээн авагч') : (item.senderName || 'Илгээгч');
  const sign   = CURRENCY_SIGN[item.currency] ?? item.currency;
  const color  = isSent ? '#ef4444' : '#16a34a';
  const prefix = isSent ? '-' : '+';
  const label  = item.invoiceNumber?.startsWith('INV-') ? 'нэхэмжлэл' : 'гүйлгээ';

  return (
    <View style={styles.txRow}>
      <Avatar name={name} />
      <View style={styles.txInfo}>
        <Text style={styles.txName}>{name}</Text>
        <Text style={styles.txMeta}>{formatDate(item.createdAt)} - SocialPay {label}</Text>
        {item.description ? <Text style={styles.txDesc}>{item.description}</Text> : null}
      </View>
      <Text style={[styles.txAmount, { color }]}>
        {prefix}{Number(item.amount).toLocaleString()}{sign}
      </Text>
    </View>
  );
}


function PayModal({ visible, accounts, loading, onClose, onPay }) {
  const [selectedId, setSelectedId] = useState(null);
  const [paying,     setPaying]     = useState(false);

  const handlePay = async () => {
    if (!selectedId) return;
    setPaying(true);
    await onPay(selectedId);
    setPaying(false);
    setSelectedId(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Данс сонгох</Text>
        <Text style={styles.sheetSub}>Аль дансаасаа төлөх вэ?</Text>
        {loading ? (
          <View style={styles.sheetCenter}><Spinner size="large" color="$blue500" /></View>
        ) : accounts.length === 0 ? (
          <View style={styles.sheetCenter}><Text style={styles.emptyText}>Данс байхгүй байна</Text></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {accounts.map((acc) => {
              const active = selectedId === acc.accountId;
              const sign   = CURRENCY_SIGN[acc.currency] ?? acc.currency;
              return (
                <TouchableOpacity
                  key={acc.accountId}
                  style={[styles.sheetAccount, active && styles.sheetAccountActive]}
                  onPress={() => setSelectedId(acc.accountId)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accNum}>{acc.accountNumber}</Text>
                    <Text style={styles.accBal}>{Number(acc.balance).toLocaleString()} {sign}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        <View style={styles.sheetBtns}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => { setSelectedId(null); onClose(); }}>
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

export default function InvoiceListScreen({ onBack }) {
  const [received, setReceived] = useState([]);
  const [sent,     setSent]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [fetched,  setFetched]  = useState(false);

  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payingId,        setPayingId]        = useState(null);
  const [payAccounts,     setPayAccounts]     = useState([]);
  const [loadingAcc,      setLoadingAcc]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rcv, snt] = await Promise.all([getMyInvoices(), getSentInvoices()]);
      setReceived(rcv.data);
      setSent(snt.data);
      setFetched(true);
    } catch {
      Alert.alert('Алдаа', 'Мэдээлэл татаж чадсангүй');
    } finally {
      setLoading(false);
    }
  }, []);

  if (!fetched && !loading) load();

  const pendingInvoices = received.filter((i) => i.status === 'UNPAID');

  const transactions = [
    ...sent.map((i)     => ({ ...i, _isSent: true })),
    ...received.filter((i) => i.status !== 'UNPAID').map((i) => ({ ...i, _isSent: false })),
  ].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  const handlePay = async (invoiceId) => {
    setPayingId(invoiceId);
    setPayAccounts([]);
    setPayModalVisible(true);
    setLoadingAcc(true);
    try {
      const userRes = await getMe();
      const accRes  = await getMyAccounts(userRes.data.userId);
      setPayAccounts(accRes.data);
    } catch {
      Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
      setPayModalVisible(false);
    } finally {
      setLoadingAcc(false);
    }
  };

  const executePay = async (accountId) => {
    try {
      await payInvoice(payingId, accountId);
      setPayModalVisible(false);
      setPayingId(null);
      load();
    } catch (e) {
      Alert.alert('Алдаа', e.response?.data?.message || 'Төлөлт амжилтгүй');
    }
  };

  const handleCancel = (id) => {
    Alert.alert('Цуцлах', 'Нэхэмжлэлийг цуцлах уу?', [
      { text: 'Үгүй' },
      {
        text: 'Тийм', style: 'destructive', onPress: async () => {
          try {
            await cancelMyInvoice(id);
            load();
          } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || 'Цуцлах амжилтгүй');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 32 }} />}
          <Text style={styles.headerTitle}>Гүйлгээний түүх</Text>
          <TouchableOpacity onPress={load} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}><Spinner size="large" color="$blue500" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

          {pendingInvoices.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Ирсэн нэхэмжлэл</Text>
              {pendingInvoices.map((item) => (
                <InvoiceRow key={item.id} item={item} onPay={handlePay} onCancel={handleCancel} />
              ))}
            </>
          )}

          {transactions.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Гүйлгээ</Text>
              {transactions.map((item) => (
                <TransactionRow key={`${item._isSent ? 's' : 'r'}-${item.id}`} item={item} />
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

      <PayModal
        visible={payModalVisible}
        accounts={payAccounts}
        loading={loadingAcc}
        onClose={() => { setPayModalVisible(false); setPayingId(null); }}
        onPay={executePay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  backArrow: { fontSize: 32, color: '#0f172a', lineHeight: 36, width: 32 },
  refreshIcon: { fontSize: 22, color: '#0891b2', width: 32, textAlign: 'right' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  invoiceAmount: { fontSize: 15, fontWeight: '700', color: '#d97706' },
  invoiceActions: { flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center' },
  payChip: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  payChipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cancelLink: { fontSize: 11, color: '#94a3b8' },
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
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  txMeta: { fontSize: 12, color: '#94a3b8' },
  txDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyStateText: { color: '#94a3b8', fontSize: 15 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, maxHeight: '70%',
  },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2,
    alignSelf: 'center', marginTop: 12, marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  sheetSub:   { fontSize: 13, color: '#94a3b8', marginBottom: 20 },
  sheetCenter: { paddingVertical: 32, alignItems: 'center' },
  sheetAccount: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', marginBottom: 10,
  },
  sheetAccountActive: { borderColor: '#0891b2', backgroundColor: '#f0f9ff' },
  accNum: { fontSize: 12, color: '#94a3b8', marginBottom: 2 },
  accBal: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: '#0891b2' },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#0891b2' },
  sheetBtns: { flexDirection: 'row', gap: 10 },
  btnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center',
  },
  btnCancelText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  btnPay:     { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#0891b2', alignItems: 'center' },
  btnDisabled: { backgroundColor: '#cbd5e1' },
  btnPayText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  emptyText:  { fontSize: 14, color: '#94a3b8' },
});