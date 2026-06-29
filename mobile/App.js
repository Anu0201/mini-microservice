import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { login, logout } from './api/authApi';
import { register } from './api/userApi';
import InvoiceListScreen from './screens/InvoiceListScreen';
import CreateInvoiceScreen from './screens/CreateInvoiceScreen';

export default function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('invoices');

  const clearFields = () => {
    setUsername('');
    setPassword('');
    setEmail('');
    setPhone('');
  };

  const handleLogin = async () => {
    try {
      const data = await login(username, password);
      setUser(data);
    } catch (e) {
      Alert.alert('Алдаа', e.response?.data?.message || e.message || 'Нэвтрэх амжилтгүй');
    }
  };

  const handleRegister = async () => {
    try {
      await register(username, password, email, phone);
      Alert.alert('Амжилттай', 'Бүртгэл үүслээ. Нэвтэрнэ үү.', [
        { text: 'OK', onPress: () => { setIsRegister(false); clearFields(); } },
      ]);
    } catch (e) {
      Alert.alert('Алдаа', e.response?.data?.message || e.message || 'Бүртгэл амжилтгүй');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setScreen('invoices');
  };

  if (user) {
    if (screen === 'create') {
      return (
        <CreateInvoiceScreen
          userId={user.id}
          onBack={() => setScreen('invoices')}
          onSuccess={() => setScreen('invoices')}
        />
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.appHeader}>
          <Text style={styles.appHeaderTitle}>Сайн байна уу, {user.username}</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Гарах</Text>
          </TouchableOpacity>
        </View>
        <InvoiceListScreen
          onCompose={() => setScreen('create')}
        />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegister ? 'Бүртгүүлэх' : 'Нэвтрэх'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Нэвтрэх нэр"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      {isRegister && (
        <>
          <TextInput
            style={styles.input}
            placeholder="И-мэйл"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Утасны дугаар"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Нууц үг"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={isRegister ? handleRegister : handleLogin}
      >
        <Text style={styles.buttonText}>{isRegister ? 'Бүртгүүлэх' : 'Нэвтрэх'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => { setIsRegister(!isRegister); clearFields(); }}
      >
        <Text style={styles.switchText}>
          {isRegister ? 'Бүртгэлтэй юу? Нэвтрэх' : 'Бүртгэлгүй юу? Бүртгүүлэх'}
        </Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  roles: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 16,
  },
  switchText: {
    color: '#2563eb',
    fontSize: 14,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  appHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});