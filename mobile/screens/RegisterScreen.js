import { useState } from 'react';
import {
  Box,
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  VStack,
  Heading,
  Pressable,
} from '@gluestack-ui/themed';
import {useRegister} from '../hooks/useRegister';

export default function RegisterScreen({ onGoLogin }) {
  const {loading, handleRegister} = useRegister({onGoLogin});

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <Box flex={1} bg="$white" alignItems="center" justifyContent="center" px="$6">
      <VStack space="md" w="$full">
        <Heading size="2xl" textAlign="center" mb="$2" color="$gray900">
          Бүртгүүлэх
        </Heading>
        <Text size="sm" textAlign="center" color="$gray500" mb="$4">
          Шинэ бүртгэл үүсгэхийн тулд мэдээллээ оруулна уу
        </Text>

        <Input variant="outline" size="lg">
          <InputField
            placeholder="Нэвтрэх нэр *"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </Input>

        <Input variant="outline" size="lg">
          <InputField
            placeholder="И-мэйл *"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </Input>

        <Input variant="outline" size="lg">
          <InputField
            placeholder="Утасны дугаар"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </Input>

        <Input variant="outline" size="lg">
          <InputField
            placeholder="Нууц үг *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </Input>

        <Button
          size="lg"
          bg="$blue600"
          mt="$2"
          isDisabled={loading}
          onPress={() => handleRegister({username, password, email, phone})}
        >
          <ButtonText>{loading ? 'Түр хүлээнэ үү...' : 'Бүртгүүлэх'}</ButtonText>
        </Button>

        <Pressable onPress={onGoLogin} mt="$2" alignItems="center">
          <Text size="sm" color="$blue600">
            Бүртгэлтэй юу?{' '}
            <Text size="sm" color="$blue600" fontWeight="$bold">
              Нэвтрэх
            </Text>
          </Text>
        </Pressable>
      </VStack>
    </Box>
  );
}