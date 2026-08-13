import {useEffect, useState} from 'react';
import {Dimensions, Modal, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {BackspaceIcon, LockIcon} from './icons';
import {COLORS} from "../constants";
import {useLanguage} from '../context/LanguageContext';
import {useTheme} from '../context/ThemeContext';

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
                                       }) {
    const {t} = useLanguage();
    const {colors} = useTheme();
    const resolvedTitle = title ?? t('Гүйлгээний PIN оруулна уу', 'Enter transaction PIN');
    const [digits, setDigits] = useState([]);

    useEffect(() => {
        if (visible) setDigits([]);
    }, [visible]);

    useEffect(() => {
        setDigits([]);
    }, [title]);

    const pressDigit = (num) => {
        if (loading || digits.length >= PIN_LENGTH) return;
        const next = [...digits, String(num)];
        setDigits(next);
        if (next.length === PIN_LENGTH) {
            setTimeout(() => onConfirm(next.join('')), 120);
        }
    };

    const pressDelete = () => {
        if (loading) return;
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
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}/>
                <View style={[styles.sheet, {backgroundColor: colors.primary}]}>
                    <View style={styles.handle}/>

                    <LockIcon size={52}/>

                    <Text style={styles.title}>{resolvedTitle}</Text>

                    <View style={styles.dotsRow}>
                        {Array.from({length: PIN_LENGTH}).map((_, i) => (
                            <View
                                key={i}
                                style={[styles.dot, i < digits.length && styles.dotFilled]}
                            />
                        ))}
                    </View>

                    {onForgot && (
                        <TouchableOpacity onPress={onForgot} hitSlop={{top: 12, bottom: 12, left: 16, right: 16}}>
                            <Text style={styles.forgot}>{t('Мартсан?', 'Forgot?')}</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.pad}>
                        {KEYS.map((row, ri) => (
                            <View key={ri} style={styles.padRow}>
                                {row.map((num) => (
                                    <TouchableOpacity
                                        key={num}
                                        style={styles.key}
                                        onPress={() => pressDigit(num)}
                                        activeOpacity={0.6}
                                    >
                                        <Text style={styles.keyText}>{num}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                        <View style={styles.padRow}>
                            <View style={styles.key}/>
                            <TouchableOpacity
                                style={styles.key}
                                onPress={() => pressDigit(0)}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.keyText}>0</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.key}
                                onPress={pressDelete}
                                activeOpacity={0.6}
                            >
                                <BackspaceIcon size={26}/>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        backgroundColor: COLORS.primaryLight,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: 36,
        paddingTop: 14,
        alignItems: 'center',
    },
    handle: {
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.6)',
        marginBottom: 28,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginTop: 16,
        marginBottom: 24,
        letterSpacing: 0.2,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 18,
        marginBottom: 20,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.35)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    dotFilled: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    forgot: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 14,
        marginBottom: 28,
        textDecorationLine: 'underline',
    },
    pad: {
        width: '100%',
        paddingHorizontal: 12,
        gap: 4,
    },
    padRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    key: {
        width: KEY_SIZE,
        height: KEY_SIZE * 0.7,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    keyText: {
        fontSize: 30,
        fontWeight: '400',
        color: '#fff',
        lineHeight: 36,
    },
});
