import { useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  VStack,
  HStack,
  Heading,
  Pressable,
  Textarea,
  TextareaInput,
} from '@gluestack-ui/themed';
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
    <Box flex={1} bg="$white">
      <SafeAreaView edges={['top']}>
        <HStack
          alignItems="center"
          px="$4"
          pb="$3"
          borderBottomWidth={1}
          borderColor="$gray200"
          space="sm"
        >
          <Pressable onPress={onBack}>
            <Text color="$blue600" size="md">← Буцах</Text>
          </Pressable>
          <Heading size="md">Нэхэмжлэл илгээх</Heading>
        </HStack>
      </SafeAreaView>

      <VStack space="lg" p="$4" mt="$2">
        <VStack space="xs">
          <Text size="sm" fontWeight="$semibold" color="$gray700">
            Хүлээн авагчийн утасны дугаар
          </Text>
          <Input variant="outline" size="lg">
            <InputField
              placeholder="+97699XXXXXX"
              value={receiverId}
              onChangeText={setReceiverId}
              keyboardType="phone-pad"
            />
          </Input>
        </VStack>

        <VStack space="xs">
          <Text size="sm" fontWeight="$semibold" color="$gray700">Үнийн дүн</Text>
          <Input variant="outline" size="lg">
            <InputField
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </Input>
        </VStack>

        <VStack space="xs">
          <Text size="sm" fontWeight="$semibold" color="$gray700">Валют</Text>
          <HStack space="sm">
            {['MNT', 'USD', 'EUR'].map((c) => (
              <Button
                key={c}
                flex={1}
                size="md"
                variant={currency === c ? 'solid' : 'outline'}
                bg={currency === c ? '$blue600' : '$white'}
                borderColor={currency === c ? '$blue600' : '$gray300'}
                onPress={() => setCurrency(c)}
              >
                <ButtonText color={currency === c ? '$white' : '$gray700'}>{c}</ButtonText>
              </Button>
            ))}
          </HStack>
        </VStack>

        <VStack space="xs">
          <Text size="sm" fontWeight="$semibold" color="$gray700">Тайлбар</Text>
          <Textarea size="lg" h={100}>
            <TextareaInput
              placeholder="Нэхэмжлэлийн тайлбар"
              value={description}
              onChangeText={setDescription}
            />
          </Textarea>
        </VStack>

        <Button
          size="lg"
          bg="$blue600"
          mt="$4"
          isDisabled={loading}
          onPress={handleSend}
        >
          <ButtonText fontWeight="$bold">
            {loading ? 'Илгээж байна...' : 'Илгээх'}
          </ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
