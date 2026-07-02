import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GluestackUIProvider, Box, Text } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { logout } from './api/authApi';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import InvoiceListScreen from './screens/InvoiceListScreen';
import CreateInvoiceScreen from './screens/CreateInvoiceScreen';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [invoiceScreen, setInvoiceScreen] = useState('invoices');

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setScreen('login');
    setInvoiceScreen('invoices');
  };

  const renderContent = () => {
    if (!user) {
      if (screen === 'login') {
        return (
          <LoginScreen
            onLoginSuccess={(data) => { setUser(data); setScreen('invoices'); }}
            onGoRegister={() => setScreen('register')}
          />
        );
      }
      return <RegisterScreen onGoLogin={() => setScreen('login')} />;
    }

    if (invoiceScreen === 'create') {
      return (
        <CreateInvoiceScreen
          userId={user.id}
          onBack={() => setInvoiceScreen('invoices')}
          onSuccess={() => setInvoiceScreen('invoices')}
        />
      );
    }

    return (
      <Box flex={1}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
          <Box style={styles.appHeader}>
            <Text style={styles.appHeaderTitle}>Сайн байна уу, {user.username}</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutText}>Гарах</Text>
            </TouchableOpacity>
          </Box>
        </SafeAreaView>
        <InvoiceListScreen onCompose={() => setInvoiceScreen('create')} />
      </Box>
    );
  };

  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={config}>
        {renderContent()}
        <StatusBar style="auto" />
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
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
