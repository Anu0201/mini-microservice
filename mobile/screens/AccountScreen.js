import { useCallback, useState } from 'react';
import { Alert, FlatList } from 'react-native';
import {
  Box,
  Text,
  Button,
  ButtonText,
  HStack,
  Heading,
  Pressable,
  Spinner,
} from '@gluestack-ui/themed';
import { getMyAccounts, createAccount } from '../api/accountApi';
import { getMe } from '../api/userApi';

const CURRENCY_BG = { MNT: '#3b82f6', USD: '#16a34a', EUR: '#9333ea' };

function AccountCard({ item, onPress }) {
  const color = CURRENCY_BG[item.currency] ?? '#6b7280';
  return (
    <Pressable onPress={() => onPress(item)}>
      <Box
        bg="$white"
        mx="$3"
        mt="$3"
        borderRadius="$xl"
        p="$4"
        elevation={1}
        shadowColor="$black"
        shadowOpacity={0.05}
        shadowRadius={4}
      >
        <HStack justifyContent="space-between" alignItems="center" mb="$2">
          <Text size="sm" color="$gray500">{item.accountNumber}</Text>
          <Box style={{ backgroundColor: color }} px="$2" py="$0.5" borderRadius={20}>
            <Text size="xs" color="$white" fontWeight="$bold">{item.currency}</Text>
          </Box>
        </HStack>
        <Text size="2xl" fontWeight="$bold" color="$gray900">
          {Number(item.balance).toLocaleString()} {item.currency}
        </Text>
        <Text size="xs" color="$gray400" mt="$1">Дарж дэлгэрэнгүйг харах →</Text>
      </Box>
    </Pressable>
  );
}

export default function AccountScreen({ onSelectAccount }) {
  const [accounts, setAccounts] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCurrency, setNewCurrency] = useState('MNT');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userRes = await getMe();
      const me = userRes.data;
      const accRes = await getMyAccounts(me.userId);
      setUserInfo(me);
      setAccounts(accRes.data);
      setFetched(true);
    } catch (e) {
      Alert.alert('Алдаа', e.response?.data?.message || 'Мэдээлэл татаж чадсангүй');
    } finally {
      setLoading(false);
    }
  }, []);

  if (!fetched && !loading) load();

  const handleCreate = () => {
    Alert.alert(
      'Данс нээх',
      `${newCurrency} данс нээх уу?`,
      [
        { text: 'Үгүй' },
        {
          text: 'Тийм',
          onPress: async () => {
            setCreating(true);
            try {
              await createAccount(userInfo.userId, newCurrency);
              load();
            } catch (e) {
              Alert.alert('Алдаа', e.response?.data?.message || 'Данс нээж чадсангүй');
            } finally {
              setCreating(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Box flex={1} bg="$backgroundLight100">
      {userInfo && (
        <Box bg="$blue600" px="$4" pt="$4" pb="$6">
          <Heading size="lg" color="$white">{userInfo.username}</Heading>
          <Text size="sm" color="$blue100" mt="$1">{userInfo.email}</Text>
          {userInfo.phoneNumber ? (
            <Text size="sm" color="$blue100">{userInfo.phoneNumber}</Text>
          ) : null}
        </Box>
      )}

      {loading ? (
        <Box flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" color="$blue600" />
        </Box>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => String(item.accountId)}
          renderItem={({ item }) => <AccountCard item={item} onPress={onSelectAccount} />}
          ListEmptyComponent={
            <Box alignItems="center" mt="$10">
              <Text color="$gray400">Данс байхгүй байна</Text>
              <Text color="$gray400" size="sm">Доорх товчоор шинэ данс нээнэ үү</Text>
            </Box>
          }
          ListFooterComponent={
            <Box mx="$3" mt="$5" mb="$8" bg="$white" borderRadius="$xl" p="$4" elevation={1} shadowOpacity={0.05}>
              <Text size="sm" fontWeight="$semibold" color="$gray700" mb="$3">Шинэ данс нээх</Text>
              <HStack space="sm" mb="$3">
                {['MNT', 'USD', 'EUR'].map((c) => (
                  <Button
                    key={c}
                    flex={1}
                    size="sm"
                    variant={newCurrency === c ? 'solid' : 'outline'}
                    bg={newCurrency === c ? '$blue600' : '$white'}
                    borderColor={newCurrency === c ? '$blue600' : '$gray300'}
                    onPress={() => setNewCurrency(c)}
                  >
                    <ButtonText color={newCurrency === c ? '$white' : '$gray700'}>{c}</ButtonText>
                  </Button>
                ))}
              </HStack>
              <Button bg="$blue600" isDisabled={creating || !userInfo} onPress={handleCreate}>
                <ButtonText fontWeight="$bold">
                  {creating ? 'Нээж байна...' : '+ Данс нээх'}
                </ButtonText>
              </Button>
            </Box>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </Box>
  );
}