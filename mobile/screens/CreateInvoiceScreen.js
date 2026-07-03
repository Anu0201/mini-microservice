import {useCallback, useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
    Box,
    Text,
    Input,
    InputField,
    Button,
    ButtonText,
    VStack,
    HStack,
    Heading,
    Pressable,
    Textarea,
    TextareaInput,
    Spinner,
} from '@gluestack-ui/themed';
import {sendInvoice} from '../api/paymentApi';
import {getMyAccounts} from '../api/accountApi';
import {getMe} from '../api/userApi';

const CURRENCY_BG = {MNT: '#3b82f6', USD: '#16a34a', EUR: '#9333ea'};

export default function CreateInvoiceScreen({onBack, onSuccess}) {
    const [receiverPhone, setReceiverPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('MNT');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const [myAccounts, setMyAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [loadingAccounts, setLoadingAccounts] = useState(false);

    const loadAccounts = useCallback(async () => {
        setLoadingAccounts(true);
        try {
            const userRes = await getMe();
            const accRes = await getMyAccounts(userRes.data.userId);
            setMyAccounts(accRes.data);
            if (accRes.data.length > 0) {
                setSelectedAccountId(accRes.data[0].accountId);
            }
        } catch {
            Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
        } finally {
            setLoadingAccounts(false);
        }
    }, []);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    const handleSend = async () => {
        if (!receiverPhone || !amount) {
            Alert.alert('Алдаа', 'Хүлээн авагч болон дүнг оруулна уу');
            return;
        }
        if (!selectedAccountId) {
            Alert.alert('Алдаа', 'Мөнгө хүлээн авах дансаа сонгоно уу');
            return;
        }
        setLoading(true);
        try {
            await sendInvoice({
                receiverPhone,
                amount: parseFloat(amount),
                currency,
                description,
                receiverAccountId: selectedAccountId,
            });
            Alert.alert('Амжилттай', 'Нэхэмжлэл илгээгдлээ', [{text: 'OK', onPress: onSuccess}]);
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || 'Илгээж чадсангүй');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box flex={1} bg="$white">
            <SafeAreaView edges={['top']}>
                <HStack alignItems="center" px="$4" pb="$3"
                        borderBottomWidth={1} borderColor="$gray200" space="sm">
                    <Pressable onPress={onBack}>
                        <Text color="$blue600" size="md">← Буцах</Text>
                    </Pressable>
                    <Heading size="md">Нэхэмжлэл илгээх</Heading>
                </HStack>
            </SafeAreaView>

            <ScrollView contentContainerStyle={{padding: 16, paddingBottom: 40}}>
                <VStack space="lg">
                    {/* Receiver phone */}
                    <VStack space="xs">
                        <Text size="sm" fontWeight="$semibold" color="$gray700">
                            Хүлээн авагчийн утасны дугаар
                        </Text>
                        <Input variant="outline" size="lg">
                            <InputField
                                placeholder="+97699XXXXXX"
                                value={receiverPhone}
                                onChangeText={setReceiverPhone}
                                keyboardType="phone-pad"
                            />
                        </Input>
                    </VStack>

                    {/* Amount */}
                    <VStack space="xs">
                        <Text size="sm" fontWeight="$semibold" color="$gray700">Үнийн дүн</Text>
                        <Input variant="outline" size="lg">
                            <InputField
                                placeholder="0.00"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                            />
                        </Input>
                    </VStack>

                    {/* Currency */}
                    <VStack space="xs">
                        <Text size="sm" fontWeight="$semibold" color="$gray700">Валют</Text>
                        <HStack space="sm">
                            {['MNT', 'USD', 'EUR'].map((c) => (
                                <Button
                                    key={c} flex={1} size="md"
                                    variant={currency === c ? 'solid' : 'outline'}
                                    bg={currency === c ? '$blue600' : '$white'}
                                    borderColor={currency === c ? '$blue600' : '$gray300'}
                                    onPress={() => setCurrency(c)}
                                >
                                    <ButtonText color={currency === c ? '$white' : '$gray700'}>{c}</ButtonText>
                                </Button>
                            ))}
                        </HStack>
                    </VStack>

                    {/* My receiving account */}
                    <VStack space="xs">
                        <Text size="sm" fontWeight="$semibold" color="$gray700">
                            Мөнгө хүлээн авах данс
                        </Text>
                        {loadingAccounts ? (
                            <Box py="$3" alignItems="center">
                                <Spinner size="small" color="$blue600"/>
                            </Box>
                        ) : myAccounts.length === 0 ? (
                            <Box p="$3" borderRadius="$lg" borderWidth={1} borderColor="$gray200"
                                 bg="$gray50" alignItems="center">
                                <Text size="sm" color="$gray500">Данс байхгүй — "Данс" таб дээр нээнэ үү</Text>
                            </Box>
                        ) : (
                            <VStack space="sm">
                                {myAccounts.map((acc) => {
                                    const selected = selectedAccountId === acc.accountId;
                                    const color = CURRENCY_BG[acc.currency] ?? '#6b7280';
                                    return (
                                        <TouchableOpacity
                                            key={acc.accountId}
                                            onPress={() => setSelectedAccountId(acc.accountId)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[
                                                styles.accountItem,
                                                selected && styles.accountItemSelected,
                                            ]}>
                                                <View style={[styles.badge, {backgroundColor: color}]}>
                                                    <Text style={styles.badgeText}>{acc.currency}</Text>
                                                </View>
                                                <View style={{flex: 1}}>
                                                    <Text style={styles.accNumber}>{acc.accountNumber}</Text>
                                                    <Text style={styles.accBalance}>
                                                        {Number(acc.balance).toLocaleString()} {acc.currency}
                                                    </Text>
                                                </View>
                                                <View style={[styles.radio, selected && styles.radioSelected]}>
                                                    {selected && <View style={styles.radioDot}/>}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </VStack>
                        )}
                    </VStack>

                    {/* Description */}
                    <VStack space="xs">
                        <Text size="sm" fontWeight="$semibold" color="$gray700">Тайлбар</Text>
                        <Textarea size="lg" h={100}>
                            <TextareaInput
                                placeholder="Нэхэмжлэлийн тайлбар"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </Textarea>
                    </VStack>

                    <Button
                        size="lg" bg="$blue600" mt="$2"
                        isDisabled={loading || !selectedAccountId}
                        onPress={handleSend}
                    >
                        <ButtonText fontWeight="$bold">
                            {loading ? 'Илгээж байна...' : 'Илгээх'}
                        </ButtonText>
                    </Button>
                </VStack>
            </ScrollView>
        </Box>
    );
}

const styles = StyleSheet.create({
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    accountItemSelected: {
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff',
    },
    badge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    badgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 11,
    },
    accNumber: {
        fontSize: 11,
        color: '#6b7280',
        marginBottom: 2,
    },
    accBalance: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: '#2563eb',
    },
    radioDot: {
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: '#2563eb',
    },
});