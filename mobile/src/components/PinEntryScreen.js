import {useEffect, useState} from 'react';
import {Dimensions, Modal, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Text} from '@gluestack-ui/themed';
import {BackspaceIcon, LockIcon} from './icons';
import {useTheme} from '../context/ThemeContext';

const PIN_LENGTH = 4;
const {width: SW} = Dimensions.get('window');
const KEY_SIZE = SW / 4.2;

const KEYS = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
];

export default function PinEntryScreen({
    visible,
    onConfirm,
    onClose,
    screenTitle,
    label,
    loading = false,
}) {
    const {colors} = useTheme();
    const insets = useSafeAreaInsets();
    const [digits, setDigits] = useState([]);

    useEffect(() => {
        if (visible) setDigits([]);
    }, [visible]);

    useEffect(() => {
        setDigits([]);
    }, [label]);

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
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={[styles.container, {backgroundColor: colors.background}]}>
                <View style={[styles.header, {paddingTop: insets.top + 8}]}>
                    <TouchableOpacity
                        onPress={onClose}
                        hitSlop={{top: 16, bottom: 16, left: 16, right: 16}}
                    >
                        <Text style={[styles.backArrow, {color: colors.text}]}>‹</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {color: colors.text}]}>{screenTitle}</Text>
                    <View style={styles.headerSpacer}/>
                </View>

                <View style={styles.body}>
                    <LockIcon size={48} color={colors.text}/>
                    <Text style={[styles.label, {color: colors.text}]}>{label}</Text>
                    <View style={styles.dotsRow}>
                        {Array.from({length: PIN_LENGTH}).map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    {backgroundColor: colors.border},
                                    i < digits.length && {backgroundColor: colors.text},
                                ]}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.pad}>
                    {KEYS.map((row, ri) => (
                        <View key={ri} style={styles.padRow}>
                            {row.map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    style={styles.key}
                                    onPress={() => pressDigit(num)}
                                    activeOpacity={0.5}
                                >
                                    <Text style={[styles.keyText, {color: colors.text}]}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                    <View style={styles.padRow}>
                        <View style={styles.key}/>
                        <TouchableOpacity style={styles.key} onPress={() => pressDigit(0)} activeOpacity={0.5}>
                            <Text style={[styles.keyText, {color: colors.text}]}>0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.key} onPress={pressDelete} activeOpacity={0.5}>
                            <BackspaceIcon size={26} color={colors.text}/>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{height: insets.bottom}}/>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    backArrow: {fontSize: 32, lineHeight: 36, width: 32},
    headerTitle: {flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700'},
    headerSpacer: {width: 32},
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 24,
    },
    label: {fontSize: 17, fontWeight: '500', marginTop: 20, marginBottom: 28},
    dotsRow: {flexDirection: 'row', gap: 20},
    dot: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    pad: {
        paddingHorizontal: 12,
        paddingBottom: 24,
        gap: 4,
    },
    padRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    key: {
        width: KEY_SIZE,
        height: KEY_SIZE * 0.72,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    keyText: {fontSize: 30, fontWeight: '400', lineHeight: 36},
});