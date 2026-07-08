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
import {useLogin} from '../hooks/useLogin';

export default function LoginScreen({ onLoginSuccess, onGoRegister }) {
  const {loading, handleLogin} = useLogin({onLoginSuccess});

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Box flex={1} bg="$white" alignItems="center" justifyContent="center" px="$6">
      <VStack space="md" w="$full">
        <Heading size="2xl" textAlign="center" mb="$2" color="$gray900">
          Нэвтрэх
        </Heading>
        <Text size="sm" textAlign="center" color="$gray500" mb="$4">
          Системд нэвтрэхийн тулд мэдээллээ оруулна уу
        </Text>

        <Input variant="outline" size="lg">
          <InputField
            placeholder="Нэвтрэх нэр"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </Input>

        <Input variant="outline" size="lg">
          <InputField
            placeholder="Нууц үг"
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
          onPress={() => handleLogin({username, password})}
        >
          <ButtonText>{loading ? 'Түр хүлээнэ үү...' : 'Нэвтрэх'}</ButtonText>
        </Button>

        <Pressable onPress={onGoRegister} mt="$2" alignItems="center">
          <Text size="sm" color="$blue600">
            Бүртгэлгүй юу?{' '}
            <Text size="sm" color="$blue600" fontWeight="$bold">
              Бүртгүүлэх
            </Text>
          </Text>
        </Pressable>
      </VStack>
    </Box>
  );
}