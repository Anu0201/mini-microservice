import {createContext, useCallback, useContext, useEffect, useState} from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_PHONE_KEY = 'biometric_phone';
const BIOMETRIC_PASSWORD_KEY = 'biometric_password';
const BIOMETRIC_PIN_ENABLED_KEY = 'biometric_pin_enabled';
const BIOMETRIC_PIN_KEY = 'biometric_pin';

const BiometricContext = createContext(null);

export function BiometricProvider({children}) {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isPinEnabled, setIsPinEnabled] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const available = hasHardware && isEnrolled;
            setIsAvailable(available);
            if (available) {
                const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
                setIsEnabled(enabled === 'true');
                const pinEnabled = await SecureStore.getItemAsync(BIOMETRIC_PIN_ENABLED_KEY);
                setIsPinEnabled(pinEnabled === 'true');
            }
            setIsLoaded(true);
        })();
    }, []);

    const saveCredentials = useCallback(async (phone, password) => {
        await SecureStore.setItemAsync(BIOMETRIC_PHONE_KEY, phone);
        await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        setIsEnabled(true);
    }, []);

    const clearCredentials = useCallback(async () => {
        await SecureStore.deleteItemAsync(BIOMETRIC_PHONE_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_PASSWORD_KEY);
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
        setIsEnabled(false);
    }, []);

    const authenticate = useCallback(async () => {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Биометр танилтаар нэвтрэх',
            fallbackLabel: 'Нууц үг ашиглах',
            cancelLabel: 'Болих',
        });
        if (!result.success) return null;
        const phone = await SecureStore.getItemAsync(BIOMETRIC_PHONE_KEY);
        const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);
        return {phone, password};
    }, []);

    const enablePinBiometric = useCallback(async (pin) => {
        await SecureStore.setItemAsync(BIOMETRIC_PIN_KEY, pin);
        await SecureStore.setItemAsync(BIOMETRIC_PIN_ENABLED_KEY, 'true');
        setIsPinEnabled(true);
    }, []);

    const disablePinBiometric = useCallback(async () => {
        await SecureStore.deleteItemAsync(BIOMETRIC_PIN_KEY);
        await SecureStore.setItemAsync(BIOMETRIC_PIN_ENABLED_KEY, 'false');
        setIsPinEnabled(false);
    }, []);

    const updateBiometricPin = useCallback(async (pin) => {
        const pinEnabled = await SecureStore.getItemAsync(BIOMETRIC_PIN_ENABLED_KEY);
        if (pinEnabled === 'true') {
            await SecureStore.setItemAsync(BIOMETRIC_PIN_KEY, pin);
        }
    }, []);

    const authenticateForPin = useCallback(async () => {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Гүйлгээг баталгаажуулах',
            fallbackLabel: 'PIN ашиглах',
            cancelLabel: 'Болих',
        });
        if (!result.success) return {success: false, error: result.error};
        const pin = await SecureStore.getItemAsync(BIOMETRIC_PIN_KEY);
        return {success: true, pin};
    }, []);

    return (
        <BiometricContext.Provider value={{
            isAvailable, isEnabled, isLoaded,
            isPinEnabled,
            saveCredentials, clearCredentials, authenticate,
            enablePinBiometric, disablePinBiometric, updateBiometricPin, authenticateForPin,
        }}>
            {children}
        </BiometricContext.Provider>
    );
}

export function useBiometric() {
    return useContext(BiometricContext);
}
