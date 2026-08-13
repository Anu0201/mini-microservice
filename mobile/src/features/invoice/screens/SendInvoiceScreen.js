import {useState} from 'react';
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '@gluestack-ui/themed';
import {useSendInvoice} from '../hooks/useSendInvoice';
import {useLanguage} from '../../../context/LanguageContext';
import {useTheme} from '../../../context/ThemeContext';

export default function SendInvoiceScreen({onBack, onSuccess}) {
    const {loading, handleSend} = useSendInvoice({onSuccess});
    const {t} = useLanguage();
    const {colors} = useTheme();

    const [receiverId, setReceiverId] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('MNT');
    const [description, setDescription] = useState('');

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                    <TouchableOpacity onPress={onBack} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                        <Text style={[styles.backArrow, {color: colors.text}]}>‹</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {color: colors.text}]}>{t('Нэхэмжлэх', 'Invoice')}</Text>
                    <View style={{width: 32}}/>
                </View>
            </SafeAreaView>

            <View style={styles.body}>
                <Text style={[styles.label, {color: colors.muted}]}>{t('Хүлээн авагчийн ID', 'Receiver ID')}</Text>
                <TextInput
                    style={[styles.input, {backgroundColor: colors.card, borderColor: colors.border, color: colors.text}]}
                    placeholder={t('Хэрэглэгчийн ID', 'User ID')}
                    placeholderTextColor={colors.muted}
                    value={receiverId}
                    onChangeText={setReceiverId}
                    keyboardType="numeric"
                />

                <Text style={[styles.label, {color: colors.muted}]}>{t('Дүн', 'Amount')}</Text>
                <TextInput
                    style={[styles.input, {backgroundColor: colors.card, borderColor: colors.border, color: colors.text}]}
                    placeholder="0.00"
                    placeholderTextColor={colors.muted}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                />

                <Text style={[styles.label, {color: colors.muted}]}>{t('Валют', 'Currency')}</Text>
                <View style={styles.currencyRow}>
                    {['MNT', 'USD', 'EUR'].map((c) => {
                        const active = currency === c;
                        return (
                            <TouchableOpacity
                                key={c}
                                style={[
                                    styles.currencyBtn,
                                    {borderColor: active ? colors.primary : colors.border},
                                    active && {backgroundColor: colors.primary},
                                ]}
                                onPress={() => setCurrency(c)}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.currencyBtnText, {color: active ? colors.textOnPrimary : colors.muted}]}>{c}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={[styles.label, {color: colors.muted}]}>{t('Тайлбар', 'Description')}</Text>
                <TextInput
                    style={[styles.input, styles.textarea, {backgroundColor: colors.card, borderColor: colors.border, color: colors.text}]}
                    placeholder={t('Нэхэмжлэлийн тайлбар (заавал биш)', 'Invoice description (optional)')}
                    placeholderTextColor={colors.muted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />

                <TouchableOpacity
                    style={[styles.submitBtn, {backgroundColor: colors.primary}, loading && {backgroundColor: colors.muted}]}
                    onPress={() => handleSend({receiverId, amount, currency, description})}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.submitText, {color: colors.textOnPrimary}]}>
                        {loading ? t('Илгээж байна...', 'Sending...') : t('Илгээх', 'Send')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    backArrow: {fontSize: 32, lineHeight: 36, width: 32},
    headerTitle: {fontSize: 17, fontWeight: '700'},
    body: {padding: 20, gap: 8},
    label: {fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8, marginBottom: 4},
    input: {
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
    },
    textarea: {minHeight: 100, textAlignVertical: 'top'},
    currencyRow: {flexDirection: 'row', gap: 10},
    currencyBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    currencyBtnText: {fontSize: 14, fontWeight: '700'},
    submitBtn: {
        marginTop: 16,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitText: {fontWeight: '700', fontSize: 17},
});
