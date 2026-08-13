import {useState} from 'react';
import {ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {COLORS} from '../../../constants';
import {useRegister} from '../hooks/useRegister';
import {useLanguage} from '../../../context/LanguageContext';
import {useTheme} from '../../../context/ThemeContext';

export default function RegisterScreen({onGoLogin, onRegisterSuccess}) {
    const {loading, handleRegister} = useRegister({onRegisterSuccess, onGoLogin});
    const {t} = useLanguage();
    const {colors} = useTheme();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <Text style={[styles.title, {color: colors.text}]}>{t('Бүртгүүлэх', 'Register')}</Text>

                <TextInput
                    style={[styles.input, {backgroundColor: colors.surface, borderColor: colors.border, color: colors.text}]}
                    placeholder={t('Нэвтрэх нэр', 'Username')}
                    placeholderTextColor={colors.muted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />

                <TextInput
                    style={[styles.input, {backgroundColor: colors.surface, borderColor: colors.border, color: colors.text}]}
                    placeholder={t('И-мэйл', 'Email')}
                    placeholderTextColor={colors.muted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

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
                    onPress={() => handleRegister({username, password, email, phone})}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.submitText, {color: colors.textOnPrimary}]}>
                        {loading ? t('Түр хүлээнэ үү...', 'Please wait...') : t('Бүртгүүлэх', 'Register')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onGoLogin} style={styles.linkRow}>
                    <Text style={[styles.linkText, {color: colors.secondary}]}>{t('Бүртгэлтэй юу? ', 'Already have an account? ')}</Text>
                    <Text style={[styles.linkBold, {color: colors.primary}]}>{t('Нэвтрэх', 'Login')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f8fafc'},
    body: {padding: 24, paddingBottom: 40, flexGrow: 1, justifyContent: 'center'},
    title: {fontSize: 22, fontWeight: '700', color: '#0f172a', marginTop: 8, marginBottom: 24},
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
        marginBottom: 16,
    },
    submitDisabled: {backgroundColor: COLORS.muted},
    submitText: {color: '#fff', fontWeight: '700', fontSize: 17},
    linkRow: {flexDirection: 'row', justifyContent: 'center'},
    linkText: {fontSize: 14, color: COLORS.secondary},
    linkBold: {fontSize: 14, color: COLORS.primaryLight, fontWeight: '700'},
});
