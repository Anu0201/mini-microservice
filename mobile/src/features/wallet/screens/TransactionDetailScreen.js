import {Image, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Text} from '@gluestack-ui/themed';
import {CURRENCY_SIGN} from '../../../constants';
import {isPrefixCurrency} from '../../../utils/helpers';
import {useLanguage} from '../../../context/LanguageContext';
import {useTheme} from '../../../context/ThemeContext';
import {ArrowDownIcon, CircleCheckIcon, CircleXIcon, MoneyIcon} from '../../../components/icons';

const pad = (n) => String(n).padStart(2, '0');

function fmtLong(str) {
    if (!str) return '';
    const d = new Date(str);
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtShort(str) {
    if (!str) return '';
    const d = new Date(str);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatAmount(amount, currency, prefix = '') {
    const sign = CURRENCY_SIGN[currency] ?? currency ?? '';
    const num = Number(amount).toLocaleString();
    return isPrefixCurrency(currency) ? `${prefix}${sign}${num}` : `${prefix}${num}${sign}`;
}

function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function AvatarCircle({name, imageUrl, size = 52, colors, muted = false}) {
    if (imageUrl) {
        return (
            <Image
                source={{uri: imageUrl}}
                style={{width: size, height: size, borderRadius: size / 2, opacity: muted ? 0.5 : 1}}
            />
        );
    }
    const bg = muted ? colors.muted + '28' : colors.primaryLight;
    const textColor = muted ? colors.muted : colors.primary;
    return (
        <View style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: bg,
            alignItems: 'center', justifyContent: 'center',
        }}>
            <Text style={{color: textColor, fontWeight: '800', fontSize: size * 0.33}}>
                {initials(name)}
            </Text>
        </View>
    );
}

function TypeRow({label, colors}) {
    return (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6}}>
            <MoneyIcon size={15} color={colors.muted}/>
            <Text style={{fontSize: 13, color: colors.muted}}>{label}</Text>
        </View>
    );
}

function Card({colors, children, style}) {
    return (
        <View style={[
            s.card,
            {backgroundColor: colors.card, borderColor: colors.primaryLight},
            style,
        ]}>
            {children}
        </View>
    );
}

// ── Invoice / transfer body ──
function InvoiceTxBody({item, colors, t}) {
    const isInvoice = item.invoiceNumber?.startsWith('INV-');
    const isSent = item._isSent;
    const isPending = isInvoice && isSent && item.status === 'UNPAID';
    const isReceivedPending = !isSent && item.status === 'UNPAID';
    const isCancelled = item.status === 'CANCELLED' || item._isDeclined;

    const name = isSent
        ? (item.receiverName || t('Хүлээн авагч', 'Receiver'))
        : (item.senderName || t('Илгээгч', 'Sender'));
    const imageUrl = isSent ? item.receiverProfileImageUrl : item.senderProfileImageUrl;

    const typeLabel = isInvoice
        ? t('SocialPay нэхэмжлэл', 'SocialPay invoice')
        : t('SocialPay гүйлгээ', 'SocialPay transfer');

    if (isPending) {
        return (
            <>
                <Card colors={colors}>
                    <View style={s.row}>
                        <View style={{flex: 1}}>
                            <Text style={[s.name, {color: colors.text}]}>{name}</Text>
                            <Text style={[s.date, {color: colors.muted}]}>{fmtShort(item.createdAt)}</Text>
                        </View>
                        <AvatarCircle name={name} imageUrl={imageUrl} colors={colors}/>
                    </View>
                </Card>

                <View style={s.arrowWrap}>
                    <ArrowDownIcon size={24} color={colors.primary}/>
                </View>

                <Card colors={colors}>
                    <Text style={[s.amount, {color: colors.primary}]}>{formatAmount(item.amount, item.currency)}</Text>
                    <TypeRow label={typeLabel} colors={colors}/>
                </Card>
            </>
        );
    }

    if (isReceivedPending) {
        return (
            <>
                <Card colors={colors}>
                    <View style={s.row}>
                        <View style={{flex: 1}}>
                            <Text style={[s.name, {color: colors.text}]}>{name}</Text>
                            <Text style={[s.date, {color: colors.muted}]}>{fmtShort(item.createdAt)}</Text>
                        </View>
                        <AvatarCircle name={name} imageUrl={imageUrl} colors={colors}/>
                    </View>
                </Card>

                <View style={s.arrowWrap}>
                    <ArrowDownIcon size={24} color={colors.primary}/>
                </View>

                <Card colors={colors}>
                    <Text style={[s.amount, {color: colors.primary}]}>{formatAmount(item.amount, item.currency)}</Text>
                    <TypeRow label={typeLabel} colors={colors}/>
                </Card>
            </>
        );
    }

    if (isCancelled) {
        return (
            <>
                <Card colors={colors}>
                    <View style={s.row}>
                        <View style={{flex: 1}}>
                            <Text style={[s.name, {color: colors.muted}]}>{name}</Text>
                            <Text style={[s.date, {color: colors.muted}]}>{fmtShort(item.createdAt)}</Text>
                        </View>
                        <AvatarCircle name={name} imageUrl={imageUrl} colors={colors} muted/>
                    </View>
                    <Text style={[s.amount, {color: colors.muted, marginTop: 12}]}>
                        {formatAmount(item.amount, item.currency)}
                    </Text>
                    <TypeRow label={typeLabel} colors={colors}/>
                </Card>

                <View style={[s.statusCard, {backgroundColor: colors.danger + '14', borderColor: colors.danger + '30'}]}>
                    <Text style={[s.statusLabel, {color: colors.danger, flex: 1}]}>
                        {isInvoice
                            ? t('Нэхэмжлэл цуцлагдлаа', 'Invoice cancelled')
                            : t('Гүйлгээ цуцлагдлаа', 'Transaction cancelled')}
                    </Text>
                    <CircleXIcon size={48} color={colors.danger}/>
                </View>
            </>
        );
    }

    // Paid / success
    return (
        <>
            <Card colors={colors}>
                <View style={s.row}>
                    <Text style={[s.name, {color: colors.text, flex: 1}]}>{name}</Text>
                    <AvatarCircle name={name} imageUrl={imageUrl} colors={colors}/>
                </View>
                <Text style={[s.amount, {color: colors.primary, marginTop: 12}]}>
                    {formatAmount(item.amount, item.currency)}
                </Text>
                <TypeRow label={typeLabel} colors={colors}/>
            </Card>

            <View style={[s.statusCard, {backgroundColor: colors.success + '18', borderColor: colors.success + '30'}]}>
                <View style={{flex: 1}}>
                    <Text style={[s.statusLabel, {color: colors.success}]}>
                        {isInvoice
                            ? t('Нэхэмжлэл төлөгдлөө', 'Invoice paid')
                            : t('Гүйлгээ амжилттай', 'Transaction successful')}
                    </Text>
                    <Text style={[s.date, {color: colors.muted, marginTop: 3}]}>{fmtLong(item.createdAt)}</Text>
                </View>
                <CircleCheckIcon size={48} color={colors.success}/>
            </View>
        </>
    );
}

// ── Account-level tx (DEPOSIT / WITHDRAW / INVOICE_CREDIT / INVOICE_DEBIT) ──
function AccountTxBody({item, colors, t}) {
    const isCredit = item.type === 'DEPOSIT' || item.type === 'INVOICE_CREDIT';
    const isInvoiceType = item.type === 'INVOICE_CREDIT' || item.type === 'INVOICE_DEBIT';
    const prefix = isCredit ? '+' : '-';
    const amountColor = isCredit ? colors.success : colors.danger;

    const typeLabel = {
        DEPOSIT: t('Орлого', 'Deposit'),
        WITHDRAW: t('Зарлага', 'Withdrawal'),
        INVOICE_CREDIT: t('SocialPay гүйлгээ', 'SocialPay transfer'),
        INVOICE_DEBIT: t('Нэхэмжлэл төлбөр', 'Invoice payment'),
    }[item.type] ?? item.type;

    return (
        <>
            <Card colors={colors}>
                {isInvoiceType && item.counterpartyName ? (
                    <View style={[s.row, {marginBottom: 12}]}>
                        <Text style={[s.name, {color: colors.text, flex: 1}]}>{item.counterpartyName}</Text>
                        <AvatarCircle name={item.counterpartyName} colors={colors}/>
                    </View>
                ) : null}
                <Text style={[s.amount, {color: amountColor}]}>
                    {formatAmount(item.amount, item.currency, prefix)}
                </Text>
                <TypeRow label={typeLabel} colors={colors}/>
            </Card>

            <View style={[s.statusCard, {backgroundColor: colors.success + '18', borderColor: colors.success + '30'}]}>
                <View style={{flex: 1}}>
                    <Text style={[s.statusLabel, {color: colors.success}]}>
                        {t('Гүйлгээ амжилттай', 'Transaction successful')}
                    </Text>
                    <Text style={[s.date, {color: colors.muted, marginTop: 3}]}>{fmtLong(item.createdAt)}</Text>
                </View>
                <CircleCheckIcon size={48} color={colors.success}/>
            </View>
        </>
    );
}

export default function TransactionDetailScreen({item, onBack, onCancel, onPay}) {
    const {t} = useLanguage();
    const {colors} = useTheme();
    const insets = useSafeAreaInsets();

    if (!item) return null;

    const isAccountTx = !!item.type;
    const isInvoice = item.invoiceNumber?.startsWith('INV-');
    const isSent = item._isSent;
    const isPending = !isAccountTx && isInvoice && isSent && item.status === 'UNPAID';
    const isPayable = !isAccountTx && !isSent && item.status === 'UNPAID';
    const isCancelled = !isAccountTx && (item.status === 'CANCELLED' || item._isDeclined);

    const title = isAccountTx
        ? t('Хийсэн гүйлгээний мэдээлэл', 'Transaction detail')
        : isInvoice && isSent
            ? t('Илгээсэн нэхэмжлэл', 'Sent invoice')
            : isInvoice
                ? t('Ирсэн нэхэмжлэл', 'Received invoice')
                : t('Хийсэн гүйлгээний мэдээлэл', 'Transaction detail');

    const showBack = !isCancelled;

    return (
        <View style={[s.container, {backgroundColor: colors.background}]}>
            <View style={[s.header, {borderBottomColor: colors.border, paddingTop: insets.top + 10}]}>
                {showBack ? (
                    <TouchableOpacity
                        onPress={onBack}
                        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                        style={s.backBtn}
                    >
                        <Text style={[s.backChevron, {color: colors.primary}]}>‹</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={s.backBtn}/>
                )}
                <Text style={[s.headerTitle, {color: colors.text}]} numberOfLines={1}>{title}</Text>
                <View style={s.backBtn}/>
            </View>

            <ScrollView
                style={{flex: 1}}
                contentContainerStyle={s.scroll}
                showsVerticalScrollIndicator={false}
            >
                {isAccountTx
                    ? <AccountTxBody item={item} colors={colors} t={t}/>
                    : <InvoiceTxBody item={item} colors={colors} t={t}/>
                }
            </ScrollView>

            <View style={{backgroundColor: colors.background, paddingBottom: insets.bottom}}>
                {isPayable ? (
                    <TouchableOpacity
                        style={[s.btn, {backgroundColor: colors.primary}]}
                        onPress={() => onPay?.(item.id)}
                        activeOpacity={0.8}
                    >
                        <Text style={[s.btnText, {color: colors.textOnPrimary}]}>{t('Төлөх', 'Pay')}</Text>
                    </TouchableOpacity>
                ) : isPending ? (
                    <TouchableOpacity
                        style={[s.btn, {backgroundColor: colors.danger + '18', borderWidth: 1, borderColor: colors.danger + '40'}]}
                        onPress={() => onCancel?.(item.id)}
                        activeOpacity={0.75}
                    >
                        <Text style={[s.btnText, {color: colors.danger}]}>{t('Цуцлах', 'Cancel')}</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[s.btn, {backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border}]}
                        onPress={onBack}
                        activeOpacity={0.75}
                    >
                        <Text style={[s.btnText, {color: colors.text}]}>{t('Хаах', 'Close')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: {flex: 1},

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {width: 32},
    backChevron: {fontSize: 34, fontWeight: '300', lineHeight: 40, marginTop: -2},
    headerTitle: {flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center'},

    scroll: {paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, gap: 12},

    card: {
        borderRadius: 20,
        padding: 20,
        borderWidth: StyleSheet.hairlineWidth,
    },

    row: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},

    name: {fontSize: 17, fontWeight: '700'},
    date: {fontSize: 13},
    amount: {fontSize: 38, fontWeight: '800', letterSpacing: -1},

    arrowWrap: {alignItems: 'center', paddingVertical: 2},

    statusCard: {
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
    },
    statusLabel: {fontSize: 16, fontWeight: '700'},

    btn: {
        alignSelf: 'center',
        paddingHorizontal: 56,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    btnText: {fontSize: 15, fontWeight: '600'},
});
