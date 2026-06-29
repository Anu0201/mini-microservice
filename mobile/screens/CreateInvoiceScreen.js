import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { sendInvoice } from '../api/paymentApi';

export default function CreateInvoiceScreen({ onBack, onSuccess }) {
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('MNT');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!receiverId || !amount) {
      Alert.alert('Алдаа', 'Хүлээн авагч болон дүнг оруулна уу');
      return;
    }
    setLoading(true);
    try {
      await sendInvoice({
        receiverPhone: receiverId,
        amount: parseFloat(amount),
        currency,
        description,
      });
      Alert.alert('Амжилттай', 'Нэхэмжлэл илгээгдлээ', [{ text: 'OK', onPress: onSuccess }]);
    } catch (e) {
      Alert.alert('Алдаа', e.response?.data?.message || 'Илгээж чадсангүй');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Буцах</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Нэхэмжлэл илгээх</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Хүлээн авагчийн утасны дугаар</Text>
        <TextInput
          style={styles.input}
          placeholder="+97699XXXXXX"
          value={receiverId}
          onChangeText={setReceiverId}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Үнийн дүн</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Валют</Text>
        <View style={styles.currencyRow}>
          {['MNT', 'USD', 'EUR'].map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.currencyBtn, currency === c && styles.currencyActive]}
              onPress={() => setCurrency(c)}
            >
              <Text style={[styles.currencyText, currency === c && { color: '#fff' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Тайлбар</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Нэхэмжлэлийн тайлбар"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSend}
          disabled={loading}
        >
          <Text style={styles.submitText}>{loading ? 'Илгээж байна...' : 'Илгээх'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 56,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  back: { color: '#2563eb', fontSize: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 20 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15 },
  textarea: { height: 100, textAlignVertical: 'top' },
  currencyRow: { flexDirection: 'row', gap: 8 },
  currencyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  currencyActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  currencyText: { fontWeight: '600', color: '#374151' },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});