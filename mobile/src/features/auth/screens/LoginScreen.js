import {useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {COLORS} from '../../../constants';
import {useLogin} from '../hooks/useLogin';

export default function LoginScreen({onLoginSuccess, onGoRegister}) {
    const {loading, handleLogin} = useLogin({onLoginSuccess});

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = () => handleLogin({phone, password});

    return (
        <View style={styles.container}>
            <View style={styles.body}>
                <Text style={styles.title}>Нэвтрэх</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Утасны дугаар"
                    placeholderTextColor={COLORS.muted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Нууц үг"
                    placeholderTextColor={COLORS.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitText}>
                        {loading ? 'Түр хүлээнэ үү...' : 'Нэвтрэх'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onGoRegister} style={styles.linkRow}>
                    <Text style={styles.linkText}>Бүртгэлгүй юу? </Text>
                    <Text style={styles.linkBold}>Бүртгүүлэх</Text>
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
        backgroundColor: COLORS.accent,
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
    linkBold: {fontSize: 14, color: COLORS.accent, fontWeight: '700'},
});
