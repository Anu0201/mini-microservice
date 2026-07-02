import { useCallback, useState } from 'react';
import { Alert, FlatList } from 'react-native';
import {
  Box,
  Text,
  Button,
  ButtonText,
  Pressable,
  Spinner,
  HStack,
  VStack,
} from '@gluestack-ui/themed';
import { cancelMyInvoice, getMyInvoices, getSentInvoices, payInvoice } from '../api/paymentApi';

const STATUS_COLOR = {
  UNPAID: '#f59e0b',
  PAID: '#16a34a',
  CANCELLED: '#6b7280',
};

function InvoiceCard({ item, onPay, onCancel, isSent }) {
  return (
    <Box
      bg="$white"
      mx="$3"
      mt="$3"
      borderRadius="$xl"
      p="$4"
      shadowColor="$black"
      shadowOpacity={0.05}
      shadowRadius={4}
      elevation={1}
    >
      <HStack justifyContent="space-between" mb="$1">
        <Text size="sm" color="$gray500">{item.invoiceNumber}</Text>
        <Text size="sm" fontWeight="$semibold" style={{ color: STATUS_COLOR[item.status] ?? '#000' }}>
          {item.status}
        </Text>
      </HStack>
      {item.senderName ? (
        <Text size="sm" color="$gray500" mb="$1">
          {isSent ? 'Та' : `Илгээсэн: ${item.senderName}`}
        </Text>
      ) : null}
      {item.description ? (
        <Text size="sm" color="$gray700" mb="$1">{item.description}</Text>
      ) : null}
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
          <Button flex={1} size="sm" variant="outline" borderColor="$gray300" onPress={() => onCancel(item.id)}>
            <ButtonText color="$gray500">Цуцлах</ButtonText>
          </Button>
        </HStack>
      )}
    </Box>
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
    <Box flex={1} bg="$backgroundLight100">
      <HStack bg="$white" borderBottomWidth={1} borderColor="$gray200">
        {['received', 'sent'].map((t) => (
          <Pressable
            key={t}
            flex={1}
            py="$3"
            alignItems="center"
            borderBottomWidth={2}
            borderColor={tab === t ? '$blue600' : '$transparent'}
            onPress={() => switchTab(t)}
          >
            <Text
              size="sm"
              fontWeight={tab === t ? '$semibold' : '$normal'}
              color={tab === t ? '$blue600' : '$gray500'}
            >
              {t === 'received' ? 'Ирсэн' : 'Илгээсэн'}
            </Text>
          </Pressable>
        ))}
      </HStack>

      {loading ? (
        <Box flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" color="$blue600" />
        </Box>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <InvoiceCard item={item} onPay={handlePay} onCancel={handleCancel} isSent={tab === 'sent'} />
          )}
          ListEmptyComponent={
            <Box alignItems="center" mt="$12">
              <Text color="$gray400">Нэхэмжлэл байхгүй байна</Text>
            </Box>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <Box position="absolute" bottom="$6" right="$4">
        <Button bg="$blue600" borderRadius="$xl" onPress={onCompose}>
          <ButtonText fontWeight="$bold">+ Нэхэмжлэл илгээх</ButtonText>
        </Button>
      </Box>
    </Box>
  );
}