import {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Dimensions, Modal, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Text} from '@gluestack-ui/themed';
import * as Haptics from 'expo-haptics';
import {BackspaceIcon, FaceIdIcon, LockIcon} from './icons';
import {useLanguage} from '../context/LanguageContext';
import {useTheme} from '../context/ThemeContext';
import {useBiometric} from '../features/auth/hooks/useBiometric';

const PIN_LENGTH = 4;
const {width: SW} = Dimensions.get('window');
const KEY_SIZE = SW / 4.2;

const KEYS = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
];

export default function PinBottomSheet({
    visible,
    onConfirm,
    onClose,
    title,
    onForgot,
    loading = false,
    useBiometricPin = true,
}) {
    const {t} = useLanguage();
    const {colors} = useTheme();
    const insets = useSafeAreaInsets();
    const {isAvailable, isPinEnabled, authenticateForPin} = useBiometric();

    const canUseBiometric = useBiometricPin && isAvailable && isPinEnabled;
    const resolvedTitle = title ?? t('Гүйлгээний PIN оруулна уу', 'Enter transaction PIN');

    const [digits, setDigits] = useState([]);
    const [mode, setMode] = useState('pin');
    const [bioLoading, setBioLoading] = useState(false);
    const [bioAttempts, setBioAttempts] = useState(0);
    const bioAttemptsRef = useRef(0);
    const autoTriggeredRef = useRef(false);

    const triggerBiometric = useCallback(async () => {
        setBioLoading(true);
        try {
            const result = await authenticateForPin();
            if (result.success && result.pin) {
                onConfirm(result.pin);
                return;
            }
            const {error} = result;
            if (error === 'user_fallback' || error === 'biometryLockout' || error === 'lockout') {
                setMode('pin');
                return;
            }
            if (error === 'authentication_failed') {
                bioAttemptsRef.current += 1;
                setBioAttempts(bioAttemptsRef.current);
                if (bioAttemptsRef.current >= 2) setMode('pin');
            }
        } catch {
            setMode('pin');
        } finally {
            setBioLoading(false);
        }
    }, [authenticateForPin, onConfirm]);

    useEffect(() => {
        if (!visible) {
            autoTriggeredRef.current = false;
            bioAttemptsRef.current = 0;
            setBioAttempts(0);
            setMode('pin');
            return;
        }
        setDigits([]);
        bioAttemptsRef.current = 0;
        setBioAttempts(0);
        setMode(canUseBiometric ? 'biometric' : 'pin');
    }, [visible]);

    useEffect(() => {
        if (!visible || mode !== 'biometric' || autoTriggeredRef.current) return;
        autoTriggeredRef.current = true;
        const timer = setTimeout(() => triggerBiometric(), 400);
        return () => clearTimeout(timer);
    }, [visible, mode, triggerBiometric]);

    useEffect(() => {
        setDigits([]);
    }, [title]);

    const pressDigit = (num) => {
        if (loading || digits.length >= PIN_LENGTH) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const next = [...digits, String(num)];
        setDigits(next);
        if (next.length === PIN_LENGTH) {
            setTimeout(() => onConfirm(next.join('')), 120);
        }
    };

    const pressDelete = () => {
        if (loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setDigits((d) => d.slice(0, -1));
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={s.overlay}>
                <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}/>
                <View style={[s.sheet, {backgroundColor: colors.surface, paddingBottom: insets.bottom + 16}]}>
                    <View style={[s.handle, {backgroundColor: colors.border}]}/>

                    {mode === 'biometric' ? (
                        <View style={s.bioContainer}>
                            <FaceIdIcon size={64} color={colors.primary}/>
                            <Text style={[s.title, {color: colors.text}]}>
                                {t('Нүүр танилтаар баталгаажуулах', 'Confirm with Face ID')}
                            </Text>
                            {bioLoading ? (
                                <ActivityIndicator color={colors.primary} size="large" style={{marginTop: 8}}/>
                            ) : (
                                <View style={s.bioButtons}>
                                    {bioAttempts > 0 && (
                                        <TouchableOpacity
                                            style={[s.bioRetryBtn, {backgroundColor: colors.primaryLight}]}
                                            onPress={() => {
                                                autoTriggeredRef.current = false;
                                                triggerBiometric();
                                            }}
                                        >
                                            <Text style={[s.bioRetryText, {color: colors.primary}]}>
                                                {t('Дахин оролдох', 'Try again')}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={() => setMode('pin')}>
                                        <Text style={[s.bioPinFallback, {color: colors.muted}]}>
                                            {t('PIN ашиглах', 'Use PIN')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ) : (
                        <>
                            <LockIcon size={52} color={colors.primary}/>
                            <Text style={[s.title, {color: colors.text}]}>{resolvedTitle}</Text>

                            <View style={s.dotsRow}>
                                {Array.from({length: PIN_LENGTH}).map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            s.dot,
                                            {backgroundColor: colors.border, borderColor: colors.border},
                                            i < digits.length && {backgroundColor: colors.primary, borderColor: colors.primary},
                                        ]}
                                    />
                                ))}
                            </View>

                            {onForgot && (
                                <TouchableOpacity onPress={onForgot} hitSlop={{top: 12, bottom: 12, left: 16, right: 16}}>
                                    <Text style={[s.forgot, {color: colors.muted}]}>
                                        {t('Мартсан?', 'Forgot?')}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <View style={s.pad}>
                                {KEYS.map((row, ri) => (
                                    <View key={ri} style={s.padRow}>
                                        {row.map((num) => (
                                            <TouchableOpacity
                                                key={num}
                                                style={[s.key, {backgroundColor: colors.card}]}
                                                onPress={() => pressDigit(num)}
                                                activeOpacity={0.6}
                                            >
                                                <Text style={[s.keyText, {color: colors.text}]}>{num}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))}
                                <View style={s.padRow}>
                                    <View style={s.key}/>
                                    <TouchableOpacity
                                        style={[s.key, {backgroundColor: colors.card}]}
                                        onPress={() => pressDigit(0)}
                                        activeOpacity={0.6}
                                    >
                                        <Text style={[s.keyText, {color: colors.text}]}>0</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={s.key}
                                        onPress={pressDelete}
                                        activeOpacity={0.6}
                                    >
                                        <BackspaceIcon size={26} color={colors.text}/>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: {flex: 1, justifyContent: 'flex-end'},
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 14,
        alignItems: 'center',
    },
    handle: {
        width: 44, height: 5, borderRadius: 3,
        marginBottom: 28,
    },
    title: {
        fontSize: 18, fontWeight: '700',
        marginTop: 16, marginBottom: 24,
        letterSpacing: 0.2,
        textAlign: 'center',
        paddingHorizontal: 24,
    },
    bioContainer: {
        alignItems: 'center',
        paddingBottom: 40,
        paddingHorizontal: 32,
        minHeight: 280,
        justifyContent: 'center',
    },
    bioButtons: {alignItems: 'center', gap: 16, marginTop: 8},
    bioRetryBtn: {
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 28,
    },
    bioRetryText: {fontSize: 15, fontWeight: '600'},
    bioPinFallback: {fontSize: 14, textDecorationLine: 'underline'},
    dotsRow: {flexDirection: 'row', gap: 18, marginBottom: 20},
    dot: {
        width: 16, height: 16, borderRadius: 8,
        borderWidth: 2,
    },
    forgot: {fontSize: 14, marginBottom: 28, textDecorationLine: 'underline'},
    pad: {width: '100%', paddingHorizontal: 12, gap: 4},
    padRow: {flexDirection: 'row', justifyContent: 'space-around'},
    key: {
        width: KEY_SIZE,
        height: KEY_SIZE * 0.7,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    keyText: {fontSize: 30, fontWeight: '400', lineHeight: 36},
});
