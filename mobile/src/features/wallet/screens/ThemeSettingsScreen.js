import {useState} from 'react';
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '@gluestack-ui/themed';
import {useTheme, THEMES} from '../../../context/ThemeContext';
import {useLanguage} from '../../../context/LanguageContext';

const THEME_NAMES = {
    lavender: 'Lavender',
    rose: 'Rose',
    ocean: 'Ocean',
    meadow: 'Meadow',
    sunset: 'Sunset',
    dark: 'Dark',
};

export default function ThemeSettingsScreen({onBack}) {
    const {theme, setThemeById, colors} = useTheme();
    const {t} = useLanguage();
    const [pendingId, setPendingId] = useState(theme.id);

    const pendingTheme = THEMES.find(thm => thm.id === pendingId) ?? theme;
    const isChanged = pendingId !== theme.id;

    const handleConfirm = async () => {
        await setThemeById(pendingId);
        onBack();
    };

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, {backgroundColor: colors.background, borderColor: colors.border}]}>
                    <TouchableOpacity onPress={onBack} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                        <Text style={[styles.backArrow, {color: colors.text}]}>‹</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {color: colors.text}]}>
                        {t('Өнгө солих', 'Change Theme')}
                    </Text>
                    <View style={{width: 32}}/>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {THEMES.map((thm) => {
                        const selected = pendingId === thm.id;
                        return (
                            <TouchableOpacity
                                key={thm.id}
                                onPress={() => setPendingId(thm.id)}
                                activeOpacity={0.8}
                                style={[
                                    styles.card,
                                    selected && {
                                        shadowColor: thm.colors.primary,
                                        shadowOpacity: 0.55,
                                        shadowRadius: 12,
                                        shadowOffset: {width: 0, height: 4},
                                        elevation: 10,
                                    },
                                ]}
                            >
                                <View style={styles.swatchRow}>
                                    {thm.swatches.map((color, i) => (
                                        <View key={i} style={[styles.swatch, {backgroundColor: color}]}/>
                                    ))}
                                </View>
                                <View style={[styles.nameRow, {backgroundColor: colors.surface}]}>
                                    <Text style={[styles.nameText, {color: selected ? thm.colors.primary : colors.text}]}>
                                        {THEME_NAMES[thm.id] ?? thm.id}
                                    </Text>
                                    {selected && (
                                        <View style={[styles.dot, {backgroundColor: thm.colors.primary}]}/>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={[styles.footer, {backgroundColor: colors.background}]}>
                <TouchableOpacity
                    style={[
                        styles.confirmBtn,
                        {backgroundColor: pendingTheme.colors.primary},
                        !isChanged && styles.confirmBtnDisabled,
                    ]}
                    onPress={handleConfirm}
                    disabled={!isChanged}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.confirmText, {color: pendingTheme.colors.textOnPrimary}]}>
                        {t('Сонгох', 'Apply')}
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
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

    body: {padding: 16, paddingTop: 20},

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        width: '47.5%',
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: {width: 0, height: 2},
        elevation: 3,
    },
    swatchRow: {
        flexDirection: 'row',
        height: 72,
    },
    swatch: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    nameText: {fontSize: 13, fontWeight: '600'},
    dot: {width: 8, height: 8, borderRadius: 4},

    footer: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
    },
    confirmBtn: {
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
    },
    confirmBtnDisabled: {opacity: 0.45},
    confirmText: {fontSize: 16, fontWeight: '700'},
});
