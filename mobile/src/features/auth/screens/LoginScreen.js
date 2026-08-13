import {useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {COLORS} from '../../../constants';
import {useLogin} from '../hooks/useLogin';
import {useLanguage} from '../../../context/LanguageContext';
import {useTheme} from '../../../context/ThemeContext';
import {FaceIdIcon} from '../../../components/icons';

export default function LoginScreen({onLoginSuccess, onGoRegister}) {
    const {loading, handleLogin, handleBiometricLogin, biometricEnabled} = useLogin({onLoginSuccess});
    const {t} = useLanguage();
    const {colors} = useTheme();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = () => handleLogin({phone, password});

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <View style={styles.body}>
                <Text style={[styles.title, {color: colors.text}]}>{t('Нэвтрэх', 'Login')}</Text>

                <TextInput
                    style={[styles.input, {backgroundColor: colors.surface, borderColor: colors.border, color: colors.text}]}
                    placeholder={t('Утасны дугаар', 'Phone number')}
                    placeholderTextColor={colors.muted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />

                <TextInput
                    style={[styles.input, {backgroundColor: colors.surface, borderColor: colors.border, color: colors.text}]}
                    placeholder={t('Нууц үг', 'Password')}
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[styles.submitBtn, {backgroundColor: colors.primary}, loading && {backgroundColor: colors.muted}]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.submitText, {color: colors.textOnPrimary}]}>
                        {loading ? t('Түр хүлээнэ үү...', 'Please wait...') : t('Нэвтрэх', 'Login')}
                    </Text>
                </TouchableOpacity>

                {biometricEnabled && (
                    <TouchableOpacity
                        style={[styles.biometricBtn]}
                        onPress={handleBiometricLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <FaceIdIcon size={22} color={colors.text}/>
                        <Text style={[styles.biometricText, {color: colors.text}]}>
                            {t('Face ID / Touch ID', 'Face ID / Touch ID')}
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={onGoRegister} style={styles.linkRow}>
                    <Text style={[styles.linkText, {color: colors.secondary}]}>{t('Бүртгэлгүй юу? ', 'No account? ')}</Text>
                    <Text style={[styles.linkBold, {color: colors.primary}]}>{t('Бүртгүүлэх', 'Register')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f8fafc'},
    body: {flex: 1, padding: 24, justifyContent: 'center'},
    title: {fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 24},
    input: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#0f172a',
        marginBottom: 12,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 12,
    },
    submitText: {color: '#fff', fontWeight: '700', fontSize: 17},
    biometricBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        marginBottom: 16,
    },
    biometricText: {fontSize: 15, fontWeight: '600'},
    linkRow: {flexDirection: 'row', justifyContent: 'center'},
    linkText: {fontSize: 14, color: COLORS.secondary},
    linkBold: {fontSize: 14, color: COLORS.primaryLight, fontWeight: '700'},
});
