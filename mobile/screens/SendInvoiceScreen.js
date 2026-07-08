import { useState } from 'react';
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
import {useSendInvoice} from '../hooks/useSendInvoice';

export default function SendInvoiceScreen({ onBack, onSuccess }) {
  const {loading, handleSend} = useSendInvoice({onSuccess});

  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('MNT');
  const [description, setDescription] = useState('');

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
          <Heading size="md">Нэхэмжлэх</Heading>
        </HStack>
      </SafeAreaView>

      <VStack space="lg" p="$4" mt="$2">
        <VStack space="xs">
          <Text size="sm" fontWeight="$semibold" color="$gray700">Хүлээн авагчийн ID</Text>
          <Input variant="outline" size="lg">
            <InputField
              placeholder="Хэрэглэгчийн ID"
              value={receiverId}
              onChangeText={setReceiverId}
              keyboardType="numeric"
            />
          </Input>
        </VStack>

        <VStack space="xs">
          <Text size="sm" fontWeight="$semibold" color="$gray700">Дүн</Text>
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
              placeholder="Нэхэмжлэлийн тайлбар (заавал биш)"
              value={description}
              onChangeText={setDescription}
            />
          </Textarea>
        </VStack>

        <Button
          size="lg"
          bg="$green600"
          mt="$4"
          isDisabled={loading}
          onPress={() => handleSend({receiverId, amount, currency, description})}
        >
          <ButtonText fontWeight="$bold">
            {loading ? 'Илгээж байна...' : 'Илгээх'}
          </ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
