import {useEffect, useRef, useState} from 'react';
import {Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {sendInvoice, sendMoney, getExchangeRate} from '../api/paymentApi';
import {getMyAccounts} from '../api/accountApi';
import {getMe, lookupUserByPhone} from '../api/userApi';
import Svg, {Path} from "react-native-svg";
import {CURRENCY_BG, CURRENCY_SIGN, CURRENCY_FALLBACK_BG, COLORS} from '../constants';

function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
}

function maskName(name) {
    if (!name || name.length <= 3) return name ?? '';
    return name[0] + name[1] + '•••' + name[name.length - 1];
}

function PhoneIcon({size = 24, color = COLORS.muted}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M16.1007 13.359L15.5719 12.8272H15.5719L16.1007 13.359ZM16.5562 12.9062L17.085 13.438H17.085L16.5562 12.9062ZM18.9728 12.5894L18.6146 13.2483L18.9728 12.5894ZM20.8833 13.628L20.5251 14.2869L20.8833 13.628ZM21.4217 16.883L21.9505 17.4148L21.4217 16.883ZM20.0011 18.2954L19.4723 17.7636L20.0011 18.2954ZM18.6763 18.9651L18.7459 19.7119H18.7459L18.6763 18.9651ZM8.81536 14.7266L9.34418 14.1947L8.81536 14.7266ZM4.00289 5.74561L3.2541 5.78816L3.2541 5.78816L4.00289 5.74561ZM10.4775 7.19738L11.0063 7.72922H11.0063L10.4775 7.19738ZM10.6342 4.54348L11.2346 4.09401L10.6342 4.54348ZM9.37326 2.85908L8.77286 3.30855V3.30855L9.37326 2.85908ZM6.26145 2.57483L6.79027 3.10667H6.79027L6.26145 2.57483ZM4.69185 4.13552L4.16303 3.60368H4.16303L4.69185 4.13552ZM12.0631 11.4972L12.5919 10.9654L12.0631 11.4972ZM16.6295 13.8909L17.085 13.438L16.0273 12.3743L15.5719 12.8272L16.6295 13.8909ZM18.6146 13.2483L20.5251 14.2869L21.2415 12.9691L19.331 11.9305L18.6146 13.2483ZM20.8929 16.3511L19.4723 17.7636L20.5299 18.8273L21.9505 17.4148L20.8929 16.3511ZM18.6067 18.2184C17.1568 18.3535 13.4056 18.2331 9.34418 14.1947L8.28654 15.2584C12.7186 19.6653 16.9369 19.8805 18.7459 19.7119L18.6067 18.2184ZM9.34418 14.1947C5.4728 10.3453 4.83151 7.10765 4.75168 5.70305L3.2541 5.78816C3.35456 7.55599 4.14863 11.144 8.28654 15.2584L9.34418 14.1947ZM10.7195 8.01441L11.0063 7.72922L9.9487 6.66555L9.66189 6.95073L10.7195 8.01441ZM11.2346 4.09401L9.97365 2.40961L8.77286 3.30855L10.0338 4.99296L11.2346 4.09401ZM5.73263 2.04299L4.16303 3.60368L5.22067 4.66736L6.79027 3.10667L5.73263 2.04299ZM10.1907 7.48257C9.66189 6.95073 9.66117 6.95144 9.66045 6.95216C9.66021 6.9524 9.65949 6.95313 9.659 6.95362C9.65802 6.95461 9.65702 6.95561 9.65601 6.95664C9.65398 6.95871 9.65188 6.96086 9.64972 6.9631C9.64539 6.96759 9.64081 6.97245 9.63599 6.97769C9.62634 6.98816 9.61575 7.00014 9.60441 7.01367C9.58174 7.04072 9.55605 7.07403 9.52905 7.11388C9.47492 7.19377 9.41594 7.2994 9.36589 7.43224C9.26376 7.70329 9.20901 8.0606 9.27765 8.50305C9.41189 9.36833 10.0078 10.5113 11.5343 12.0291L12.5919 10.9654C11.1634 9.54499 10.8231 8.68059 10.7599 8.27309C10.7298 8.07916 10.761 7.98371 10.7696 7.96111C10.7748 7.94713 10.7773 7.9457 10.7709 7.95525C10.7677 7.95992 10.7624 7.96723 10.7541 7.97708C10.75 7.98201 10.7451 7.98759 10.7394 7.99381C10.7365 7.99692 10.7335 8.00019 10.7301 8.00362C10.7285 8.00534 10.7268 8.00709 10.725 8.00889C10.7241 8.00979 10.7232 8.0107 10.7223 8.01162C10.7219 8.01208 10.7212 8.01278 10.7209 8.01301C10.7202 8.01371 10.7195 8.01441 10.1907 7.48257ZM11.5343 12.0291C13.0613 13.5474 14.2096 14.1383 15.0763 14.2713C15.5192 14.3392 15.8763 14.285 16.1472 14.1841C16.28 14.1346 16.3858 14.0763 16.4658 14.0227C16.5058 13.9959 16.5392 13.9704 16.5663 13.9479C16.5799 13.9367 16.5919 13.9262 16.6024 13.9166C16.6077 13.9118 16.6126 13.9073 16.6171 13.903C16.6194 13.9008 16.6215 13.8987 16.6236 13.8967C16.6246 13.8957 16.6256 13.8947 16.6266 13.8937C16.6271 13.8932 16.6279 13.8925 16.6281 13.8923C16.6288 13.8916 16.6295 13.8909 16.1007 13.359C15.5719 12.8272 15.5726 12.8265 15.5733 12.8258C15.5735 12.8256 15.5742 12.8249 15.5747 12.8244C15.5756 12.8235 15.5765 12.8226 15.5774 12.8217C15.5793 12.82 15.581 12.8183 15.5827 12.8166C15.5862 12.8133 15.5895 12.8103 15.5926 12.8074C15.5988 12.8018 15.6044 12.7969 15.6094 12.7929C15.6192 12.7847 15.6265 12.7795 15.631 12.7764C15.6403 12.7702 15.6384 12.773 15.6236 12.7785C15.5991 12.7876 15.501 12.8189 15.3038 12.7886C14.8905 12.7253 14.02 12.3853 12.5919 10.9654L11.5343 12.0291ZM9.97365 2.40961C8.95434 1.04802 6.94996 0.83257 5.73263 2.04299L6.79027 3.10667C7.32195 2.578 8.26623 2.63181 8.77286 3.30855L9.97365 2.40961ZM4.75168 5.70305C4.73201 5.35694 4.89075 4.9954 5.22067 4.66736L4.16303 3.60368C3.62571 4.13795 3.20329 4.89425 3.2541 5.78816L4.75168 5.70305ZM19.4723 17.7636C19.1975 18.0369 18.9029 18.1908 18.6067 18.2184L18.7459 19.7119C19.4805 19.6434 20.0824 19.2723 20.5299 18.8273L19.4723 17.7636ZM11.0063 7.72922C11.9908 6.7503 12.064 5.2019 11.2346 4.09401L10.0338 4.99295C10.4373 5.53193 10.3773 6.23938 9.9487 6.66555L11.0063 7.72922ZM20.5251 14.2869C21.3429 14.7315 21.4703 15.7769 20.8929 16.3511L21.9505 17.4148C23.2908 16.0821 22.8775 13.8584 21.2415 12.9691L20.5251 14.2869ZM17.085 13.438C17.469 13.0562 18.0871 12.9616 18.6146 13.2483L19.331 11.9305C18.2474 11.3414 16.9026 11.5041 16.0273 12.3743L17.085 13.438Z"
                fill={color}/>
        </Svg>
    );
}

export default function SendMoneyScreen({
                                            action = 'send',
                                            amount = 0,
                                            currency: filterCurrency = null,
                                            onBack,
                                            onSuccess
                                        }) {
    const [receiverPhone, setReceiverPhone] = useState('');
    const [receiverUser, setReceiverUser] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const lookupTimer = useRef(null);
    const [description, setDescription] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loadingAcc, setLoadingAcc] = useState(action === 'send');
    const [sending, setSending] = useState(false);

    const [invoiceCurrency, setInvoiceCurrency] = useState(filterCurrency ?? 'MNT');
    const [exchangeRate, setExchangeRate] = useState(null);
    const [loadingRate, setLoadingRate] = useState(false);
    const [myAccounts, setMyAccounts] = useState([]);
    const [receiverAccountId, setReceiverAccountId] = useState(null);
    const [loadingMyAcc, setLoadingMyAcc] = useState(action === 'invoice');

    const isSend = action === 'send';

    const selectedAccount = accounts.find((a) => a.accountId === selectedId);
    const needsConversion = isSend && filterCurrency && selectedAccount && selectedAccount.currency !== filterCurrency;

    const currency = isSend
        ? (filterCurrency ?? selectedAccount?.currency ?? 'MNT')
        : invoiceCurrency;
    const currencySign = CURRENCY_SIGN[currency] ?? currency;

    useEffect(() => {
        if (!needsConversion) {
            setExchangeRate(null);
            return;
        }
        setLoadingRate(true);
        setExchangeRate(null);
        getExchangeRate(filterCurrency, selectedAccount.currency)
            .then((res) => setExchangeRate(res.data.rate))
            .catch(() => setExchangeRate(null))
            .finally(() => setLoadingRate(false));
    }, [selectedId]);

    useEffect(() => {
        if (isSend) return;
        (async () => {
            try {
                const userRes = await getMe();
                const accRes = await getMyAccounts(userRes.data.userId);
                const invoiceCurr = filterCurrency ?? 'MNT';
                const filtered = accRes.data.filter((a) => a.currency === invoiceCurr);
                setMyAccounts(filtered.length > 0 ? filtered : accRes.data);
                const preferred = filtered[0] ?? accRes.data[0];
                if (preferred) setReceiverAccountId(preferred.accountId);
            } catch {
                Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
            } finally {
                setLoadingMyAcc(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!isSend) return;
        (async () => {
            try {
                const userRes = await getMe();
                const accRes = await getMyAccounts(userRes.data.userId);
                setAccounts(accRes.data);
                const preferred = filterCurrency
                    ? (accRes.data.find((a) => a.currency === filterCurrency) ?? accRes.data[0])
                    : accRes.data[0];
                if (preferred) setSelectedId(preferred.accountId);
            } catch {
                Alert.alert('Алдаа', 'Дансны мэдээлэл татаж чадсангүй');
            } finally {
                setLoadingAcc(false);
            }
        })();
    }, []);

    useEffect(() => {
        const phone = receiverPhone.trim();
        setReceiverUser(null);
        if (lookupTimer.current) clearTimeout(lookupTimer.current);
        if (phone.length < 8) return;
        setLookupLoading(true);
        lookupTimer.current = setTimeout(async () => {
            try {
                const res = await lookupUserByPhone(phone);
                setReceiverUser(res.data);
            } catch (e) {
                console.log('[lookup error]', e?.response?.status, e?.response?.data, e?.message);
                setReceiverUser(null);
            } finally {
                setLookupLoading(false);
            }
        }, 600);
        return () => clearTimeout(lookupTimer.current);
    }, [receiverPhone]);

    const doSubmit = async () => {
        setSending(true);
        try {
            if (isSend) {
                await sendMoney({receiverPhone, amount, currency, description, senderAccountId: selectedId});
                Alert.alert('Амжилттай', 'Мөнгө амжилттай илгээгдлээ', [{text: 'OK', onPress: onSuccess}]);
            } else {
                await sendInvoice({receiverPhone, amount, currency, description, receiverAccountId});
                Alert.alert('Амжилттай', 'Нэхэмжлэл илгээгдлээ', [{text: 'OK', onPress: onSuccess}]);
            }
        } catch (e) {
            Alert.alert('Алдаа', e.response?.data?.message || 'Амжилтгүй боллоо');
        } finally {
            setSending(false);
        }
    };

    const handleSubmit = () => {
        if (!receiverPhone.trim()) {
            Alert.alert('Алдаа', 'Утасны дугаар оруулна уу');
            return;
        }
        if (amount <= 0) {
            Alert.alert('Алдаа', 'Дүн оруулна уу');
            return;
        }
        if (isSend && !selectedId) {
            Alert.alert('Алдаа', 'Данс сонгоно уу');
            return;
        }
        const sign = CURRENCY_SIGN[currency] ?? currency;
        const amountStr = `${Number(amount).toLocaleString()} ${sign}`;
        const msg = isSend
            ? `${receiverPhone} дугаарт ${amountStr} илгээх үү?`
            : `${receiverPhone} дугаараас ${amountStr} нэхэмжлэх үү?`;
        Alert.alert('Итгэлтэй байна уу?', msg, [
            {text: 'Үгүй', style: 'cancel'},
            {text: 'Тийм', onPress: doSubmit},
        ]);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                        <Text style={styles.backArrow}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {Number(amount).toLocaleString()} {currencySign} {isSend ? 'илгээх' : 'нэхэмжлэх'}
                    </Text>
                    <View style={{width: 32}}/>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                {/* Phone input */}
                <View style={styles.inputCard}>
                    <PhoneIcon size={24} color="#94a3b8"/>
                    <TextInput
                        style={styles.phoneInput}
                        placeholder="Утасны дугаар оруулах"
                        placeholderTextColor="#94a3b8"
                        value={receiverPhone}
                        onChangeText={setReceiverPhone}
                        keyboardType="phone-pad"
                    />
                </View>

                {lookupLoading && (
                    <View style={styles.userCard}>
                        <Spinner size="small" color={COLORS.accent}/>
                    </View>
                )}
                {!lookupLoading && receiverUser && (
                    <View style={styles.userCard}>
                        <View style={styles.userCardLeft}>
                            <Text style={styles.userCardPhone}>{receiverUser.phoneNumber}</Text>
                            <Text style={styles.userCardName}>{maskName(receiverUser.username)}</Text>
                        </View>
                        <View style={styles.userAvatar}>
                            <Text style={styles.userAvatarText}>{initials(receiverUser.username)}</Text>
                        </View>
                    </View>
                )}
                {!lookupLoading && receiverPhone.trim().length >= 8 && !receiverUser && (
                    <View style={[styles.userCard, styles.userCardNotFound]}>
                        <Text style={styles.userCardNotFoundText}>Хэрэглэгч олдсонгүй</Text>
                    </View>
                )}

                {isSend ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Илгээх данс</Text>
                        {loadingAcc ? (
                            <View style={styles.centerPad}><Spinner color="$blue500"/></View>
                        ) : accounts.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>Данс байхгүй байна</Text>
                            </View>
                        ) : (
                            accounts.map((acc) => {
                                const active = selectedId === acc.accountId;
                                const sign = CURRENCY_SIGN[acc.currency] ?? acc.currency;
                                return (
                                    <TouchableOpacity
                                        key={acc.accountId}
                                        style={[styles.accountRow, active && styles.accountRowActive]}
                                        onPress={() => setSelectedId(acc.accountId)}
                                        activeOpacity={0.7}
                                    >
                                        <View
                                            style={[styles.badge, {backgroundColor: CURRENCY_BG[acc.currency] ?? CURRENCY_FALLBACK_BG}]}>
                                            <Text style={styles.badgeText}>{acc.currency}</Text>
                                        </View>
                                        <View style={{flex: 1}}>
                                            <Text style={styles.accNum}>{acc.accountNumber}</Text>
                                            <Text style={styles.accBal}>
                                                {Number(acc.balance).toLocaleString()} {sign}
                                            </Text>
                                        </View>
                                        <View style={[styles.radio, active && styles.radioActive]}>
                                            {active && <View style={styles.radioDot}/>}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Хүлээн авах данс</Text>
                        {loadingMyAcc ? (
                            <View style={styles.centerPad}><Spinner color="$blue500"/></View>
                        ) : myAccounts.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>Данс байхгүй байна</Text>
                            </View>
                        ) : (
                            myAccounts.map((acc) => {
                                const active = receiverAccountId === acc.accountId;
                                const sign = CURRENCY_SIGN[acc.currency] ?? acc.currency;
                                return (
                                    <TouchableOpacity
                                        key={acc.accountId}
                                        style={[styles.accountRow, active && styles.accountRowActive]}
                                        onPress={() => setReceiverAccountId(acc.accountId)}
                                        activeOpacity={0.7}
                                    >
                                        <View
                                            style={[styles.badge, {backgroundColor: CURRENCY_BG[acc.currency] ?? CURRENCY_FALLBACK_BG}]}>
                                            <Text style={styles.badgeText}>{acc.currency}</Text>
                                        </View>
                                        <View style={{flex: 1}}>
                                            <Text style={styles.accNum}>{acc.accountNumber}</Text>
                                            <Text style={styles.accBal}>
                                                {Number(acc.balance).toLocaleString()} {sign}
                                            </Text>
                                        </View>
                                        <View style={[styles.radio, active && styles.radioActive]}>
                                            {active && <View style={styles.radioDot}/>}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                )}


                {needsConversion && (
                    <View style={styles.conversionCard}>
                        {loadingRate ? (
                            <Text style={styles.conversionText}>Ханш татаж байна...</Text>
                        ) : exchangeRate ? (
                            <>
                                <Text style={styles.conversionText}>
                                    1 {filterCurrency} = {CURRENCY_SIGN[selectedAccount.currency]}{Number(exchangeRate).toLocaleString(undefined, {maximumFractionDigits: 4})} {selectedAccount.currency}
                                </Text>
                                <Text style={[styles.conversionText, {marginTop: 4, fontWeight: '700'}]}>
                                    {CURRENCY_SIGN[filterCurrency]}{Number(amount).toLocaleString()} {filterCurrency} → {CURRENCY_SIGN[selectedAccount.currency]}{Number(amount * exchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})} {selectedAccount.currency}
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.conversionText}>
                                {filterCurrency} → {selectedAccount.currency} ханшаар хөрвүүлэгдэнэ
                            </Text>
                        )}
                    </View>
                )}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Тайлбар</Text>
                    <TextInput
                        style={styles.descInput}
                        placeholder="Шилжүүлгийн тайлбар (заавал биш)"
                        placeholderTextColor="#94a3b8"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                    />
                </View>
            </ScrollView>

            <SafeAreaView edges={['bottom']}>
                <TouchableOpacity
                    style={[
                        styles.submitBtn,
                        isSend ? styles.submitSend : styles.submitInvoice,
                        sending && styles.submitDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={sending}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitText}>
                        {sending ? 'Илгээж байна...' : isSend ? 'Илгээх' : 'Нэхэмжлэх'}
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#fff'},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    backArrow: {fontSize: 32, color: '#0f172a', lineHeight: 36},
    headerTitle: {fontSize: 17, fontWeight: '700', color: '#0f172a'},
    body: {padding: 20, paddingBottom: 32},
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    phoneIcon: {fontSize: 18, marginRight: 10},
    phoneInput: {flex: 1, fontSize: 16, color: '#0f172a', paddingVertical: 14},
    section: {marginBottom: 20},
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.muted,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    centerPad: {paddingVertical: 24, alignItems: 'center'},
    emptyCard: {backgroundColor: '#f8fafc', borderRadius: 12, padding: 16},
    emptyText: {color: COLORS.muted, fontSize: 14},
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    accountRowActive: {borderColor: COLORS.accent, backgroundColor: COLORS.accentLight},
    badge: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12},
    badgeText: {color: '#fff', fontWeight: '700', fontSize: 11},
    accNum: {fontSize: 12, color: COLORS.muted, marginBottom: 2},
    accBal: {fontSize: 16, fontWeight: '700', color: '#0f172a'},
    radio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: '#cbd5e1',
        alignItems: 'center', justifyContent: 'center',
    },
    radioActive: {borderColor: COLORS.accent},
    radioDot: {width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.accent},
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 14,
        padding: 4,
        gap: 4,
    },
    toggleBtn: {flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center'},
    toggleActive: {backgroundColor: COLORS.accent},
    toggleText: {fontSize: 13, fontWeight: '600', color: COLORS.secondary},
    toggleTextActive: {color: '#fff'},
    descInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.toggleBg,
        padding: 14,
        fontSize: 15,
        color: '#0f172a',
        minHeight: 90,
        textAlignVertical: 'top',
    },
    conversionCard: {
        backgroundColor: COLORS.convertBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.convertBg,
        padding: 12,
        marginBottom: 20,
    },
    conversionText: {fontSize: 13, color: COLORS.convertText, fontWeight: '500'},
    submitBtn: {
        marginHorizontal: 16,
        marginBottom: 12,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitSend: {backgroundColor: COLORS.accent},
    submitInvoice: {backgroundColor: COLORS.primary},
    submitDisabled: {backgroundColor: COLORS.muted},
    submitText: {color: '#fff', fontWeight: '700', fontSize: 17},
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 20,
        minHeight: 64,
    },
    userCardLeft: {flex: 1},
    userCardPhone: {fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2},
    userCardName: {fontSize: 14, color: COLORS.secondary},
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userAvatarText: {color: '#fff', fontWeight: '700', fontSize: 16},
    userCardNotFound: {justifyContent: 'center'},
    userCardNotFoundText: {color: COLORS.muted, fontSize: 14},
});
