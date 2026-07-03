import { useCallback, useState } from 'react';
import { Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  Text,
  Button,
  ButtonText,
  HStack,
  VStack,
  Heading,
  Pressable,
  Spinner,
  Input,
  InputField,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@gluestack-ui/themed';
import { getAccount, deposit, withdraw, getTransactions } from '../api/accountApi';

const TX_LABEL = {
  DEPOSIT: 'Орлого',
  WITHDRAW: 'Зарлага',
  INVOICE_CREDIT: 'Нэхэмжлэл орлого',
  INVOICE_DEBIT: 'Нэхэмжлэл зарлага',
};

const TX_SIGN = {
  DEPOSIT: '+',
  INVOICE_CREDIT: '+',
  WITHDRAW: '-',
  INVOICE_DEBIT: '-',
};

const TX_COLOR = {
  DEPOSIT: '#16a34a',
  INVOICE_CREDIT: '#16a34a',
  WITHDRAW: '#ef4444',
  INVOICE_DEBIT: '#ef4444',
};

function TxCard({ item }) {
  const sign = TX_SIGN[item.type] ?? '';
  const color = TX_COLOR[item.type] ?? '#374151';
  const label = TX_LABEL[item.type] ?? item.type;
  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleString('mn-MN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <Box
      bg="$white"
      mx="$3"
      mt="$2"
      borderRadius="$lg"
      px="$4"
      py="$3"
      elevation={1}
      shadowColor="$black"
      shadowOpacity={0.03}
      shadowRadius={2}
    >
      <HStack justifyContent="space-between" alignItems="center">
        <VStack flex={1} mr="$2">
          <Text size="sm" fontWeight="$semibold" color="$gray800">{label}</Text>
          {item.description ? (
            <Text size="xs" color="$gray500">{item.description}</Text>
          ) : null}
          <Text size="xs" color="$gray400" mt="$0.5">{date}</Text>
        </VStack>
        <VStack alignItems="flex-end">
          <Text size="md" fontWeight="$bold" style={{ color }}>
            {sign}{Number(item.amount).toLocaleString()}
          </Text>
          <Text size="xs" color="$gray400">→ {Number(item.balanceAfter).toLocaleString()}</Text>
        </VStack>
      </HStack>
    </Box>
  );
}

export default function AccountDetailScreen({ accountId, onBack }) {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [modal, setModal] = useState(null);
  const [amount, setAmount] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, txRes] = await Promise.all([
        getAccount(accountId),
        getTransactions(accountId),
      ]);
      setAccount(accRes.data);
      setTransactions(txRes.data);
      setFetched(true);
    } catch {
      Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  if (!fetched && !loading) load();

  const openModal = (type) => {
    setAmount('');
    setModal(type);
  };

  const handleTransaction = async () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Алдаа', '0-ээс их дүн оруулна уу');
      return;
    }
    setTxLoading(true);
    try {
      if (modal === 'deposit') {
        await deposit(accountId, parsed);
      } else {
        await withdraw(accountId, parsed);
      }
      setModal(null);
      setAmount('');
      load();
    } catch (e) {
      Alert.alert('Алдаа', e.response?.data?.message || 'Гүйлгээ амжилтгүй');
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <Box flex={1} bg="$backgroundLight100">
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#2563eb' }}>
        <HStack
          alignItems="center"
          px="$4"
          pb="$3"
          pt="$2"
          space="sm"
          bg="$blue600"
        >
          <Pressable onPress={onBack} hitSlop={8}>
            <Text color="$white" size="lg">←</Text>
          </Pressable>
          <Heading size="md" color="$white">Дансны мэдээлэл</Heading>
        </HStack>
      </SafeAreaView>

      {loading || !account ? (
        <Box flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" color="$blue600" />
        </Box>
      ) : (
        <>
          <Box bg="$blue600" px="$4" pb="$6">
            <Text size="sm" color="$blue100">{account.accountNumber}</Text>
            <Text size="4xl" fontWeight="$bold" color="$white" mt="$1">
              {Number(account.balance).toLocaleString()}
            </Text>
            <Text size="md" color="$blue100">{account.currency}</Text>
            <HStack space="sm" mt="$5">
              <Button flex={1} bg="$white" borderRadius="$lg" onPress={() => openModal('deposit')}>
                <ButtonText color="$blue600" fontWeight="$bold">↓ Орлого</ButtonText>
              </Button>
              <Button
                flex={1}
                variant="outline"
                borderColor="$white"
                borderRadius="$lg"
                onPress={() => openModal('withdraw')}
              >
                <ButtonText color="$white" fontWeight="$bold">↑ Зарлага</ButtonText>
              </Button>
            </HStack>
          </Box>

          <Text
            size="sm"
            fontWeight="$semibold"
            color="$gray600"
            px="$4"
            mt="$4"
            mb="$1"
          >
            ГҮЙЛГЭЭНИЙ ТҮҮХ
          </Text>

          <FlatList
            data={transactions}
            keyExtractor={(item) => String(item.transactionId)}
            renderItem={({ item }) => <TxCard item={item} />}
            ListEmptyComponent={
              <Box alignItems="center" mt="$10">
                <Text color="$gray400">Гүйлгээний түүх байхгүй байна</Text>
              </Box>
            }
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(null)}>
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">
              {modal === 'deposit' ? 'Орлого оруулах' : 'Зарлага гаргах'}
            </Heading>
          </ModalHeader>
          <ModalBody>
            <VStack space="sm">
              <Text size="sm" color="$gray600">
                Дүн ({account?.currency})
              </Text>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </Input>
              {account && (
                <Text size="xs" color="$gray400">
                  Одоогийн үлдэгдэл: {Number(account.balance).toLocaleString()} {account.currency}
                </Text>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack space="sm" flex={1}>
              <Button
                flex={1}
                variant="outline"
                borderColor="$gray300"
                onPress={() => setModal(null)}
              >
                <ButtonText color="$gray500">Цуцлах</ButtonText>
              </Button>
              <Button
                flex={1}
                bg={modal === 'deposit' ? '$green600' : '$blue600'}
                isDisabled={txLoading}
                onPress={handleTransaction}
              >
                <ButtonText fontWeight="$bold">
                  {txLoading ? 'Хүлээнэ үү...' : 'Батлах'}
                </ButtonText>
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}