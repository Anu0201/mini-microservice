import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { cancelMyInvoice, getMyInvoices, getSentInvoices, payInvoice } from '../api/paymentApi';

const STATUS_COLOR = {
  UNPAID: '#f59e0b',
  PAID: '#16a34a',
  CANCELLED: '#6b7280',
};

function InvoiceCard({ item, onPay, onCancel, isSent }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
        <Text style={[styles.status, { color: STATUS_COLOR[item.status] ?? '#000' }]}>
          {item.status}
        </Text>
      </View>
      {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      <Text style={styles.amount}>
        {Number(item.amount).toLocaleString()} {item.currency}
      </Text>
      {item.status === 'UNPAID' && (
        <View style={styles.actions}>
          {!isSent && (
            <TouchableOpacity style={styles.payButton} onPress={() => onPay(item.id)}>
              <Text style={styles.payText}>Төлөх</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => onCancel(item.id)}>
            <Text style={styles.cancelText}>Цуцлах</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function InvoiceListScreen({ onCompose }) {
  const [tab, setTab] = useState('received');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const load = useCallback(async (activeTab) => {
    setLoading(true);
    try {
      const { data } = activeTab === 'received'
        ? await getMyInvoices()
        : await getSentInvoices();
      setInvoices(data);
      setFetched(true);
    } catch (e) {
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

  const handlePay = async (id) => {
    try {
      await payInvoice(id);
      load(tab);
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
            load(tab);
          } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || 'Цуцлах амжилтгүй');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'received' && styles.activeTab]}
          onPress={() => switchTab('received')}
        >
          <Text style={[styles.tabText, tab === 'received' && styles.activeTabText]}>
            Ирсэн
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'sent' && styles.activeTab]}
          onPress={() => switchTab('sent')}
        >
          <Text style={[styles.tabText, tab === 'sent' && styles.activeTabText]}>
            Илгээсэн
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <InvoiceCard item={item} onPay={handlePay} onCancel={handleCancel} isSent={tab === 'sent'} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>Нэхэмжлэл байхгүй байна</Text>}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <View style={styles.fab}>
        <TouchableOpacity style={[styles.fabButton, { backgroundColor: '#2563eb' }]} onPress={onCompose}>
          <Text style={styles.fabText}>+ Нэхэмжлэл илгээх</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderColor: '#2563eb' },
  tabText: { fontSize: 15, color: '#6b7280' },
  activeTabText: { color: '#2563eb', fontWeight: '600' },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 10, padding: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  invoiceNumber: { fontSize: 13, color: '#6b7280' },
  status: { fontSize: 13, fontWeight: '600' },
  description: { fontSize: 14, color: '#374151', marginBottom: 6 },
  amount: { fontSize: 20, fontWeight: '700', color: '#111827' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  payButton: { flex: 1, backgroundColor: '#16a34a', borderRadius: 8, padding: 10, alignItems: 'center' },
  payText: { color: '#fff', fontWeight: '600' },
  cancelButton: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelText: { color: '#6b7280', fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 48, color: '#9ca3af' },
  fab: { position: 'absolute', bottom: 24, right: 16, gap: 10, flexDirection: 'row' },
  fabButton: { backgroundColor: '#059669', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12, elevation: 3 },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});