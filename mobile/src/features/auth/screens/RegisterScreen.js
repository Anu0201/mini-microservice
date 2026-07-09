import {useState} from 'react';
import {ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {COLORS} from '../../../constants';
import {useRegister} from '../hooks/useRegister';

export default function RegisterScreen({onGoLogin}) {
    const {loading, handleRegister} = useRegister({onGoLogin});

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Бүртгүүлэх</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Нэвтрэх нэр"
                    placeholderTextColor={COLORS.muted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="И-мэйл"
                    placeholderTextColor={COLORS.muted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

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
                    onPress={() => handleRegister({username, password, email, phone})}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitText}>
                        {loading ? 'Түр хүлээнэ үү...' : 'Бүртгүүлэх'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onGoLogin} style={styles.linkRow}>
                    <Text style={styles.linkText}>Бүртгэлтэй юу? </Text>
                    <Text style={styles.linkBold}>Нэвтрэх</Text>
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
