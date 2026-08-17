import {Alert, StyleSheet, Switch, TouchableOpacity, View, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '@gluestack-ui/themed';
import {LockIcon, ColorPaletteIcon, LanguageIcon, LogoutIcon, FaceIdIcon} from '../../../components/icons';
import {useLanguage} from '../../../context/LanguageContext';
import {useTheme} from '../../../context/ThemeContext';
import {useBiometric} from '../../auth/hooks/useBiometric';
import {checkPin} from '../../../services/pinApi';
import PinBottomSheet from '../../../components/PinBottomSheet';
import {useState} from 'react';

function MenuItem({icon, label, sub, onPress, chevron = true, colors}) {
    return (
        <TouchableOpacity
            style={[styles.menuItem, {borderColor: colors.border}]}
            onPress={onPress}
            activeOpacity={0.72}
        >
            <View style={[styles.menuIcon, {backgroundColor: colors.accentLight}]}>{icon}</View>
            <View style={{flex: 1}}>
                <Text style={[styles.menuLabel, {color: colors.text}]}>{label}</Text>
                {sub ? <Text style={[styles.menuSub, {color: colors.muted}]}>{sub}</Text> : null}
            </View>
            {chevron && <Text style={[styles.menuChevron, {color: colors.muted}]}>›</Text>}
        </TouchableOpacity>
    );
}

export default function MenuScreen({onOpenPin, onOpenLanguage, onOpenTheme, onLogout}) {
    const {t, lang} = useLanguage();
    const {colors, theme} = useTheme();
    const {isAvailable, isPinEnabled, enablePinBiometric, disablePinBiometric} = useBiometric();

    const [pinEntryVisible, setPinEntryVisible] = useState(false);

    const THEME_NAMES = {lavender: 'Lavender', rose: 'Rose', ocean: 'Ocean', meadow: 'Meadow', sunset: 'Sunset', dark: 'Dark'};
    const themeName = THEME_NAMES[theme.id] ?? theme.id;

    const handleBiometricToggle = (value) => {
        if (!value) {
            Alert.alert(
                t('Идэвхгүй болгох', 'Disable'),
                t('Face ID / Touch ID-г идэвхгүй болгох уу?', 'Disable Face ID / Touch ID?'),
                [
                    {text: t('Болих', 'Cancel'), style: 'cancel'},
                    {text: t('Идэвхгүй болгох', 'Disable'), style: 'destructive', onPress: disablePinBiometric},
                ]
            );
        } else {
            setPinEntryVisible(true);
        }
    };

    const handlePinEntryConfirm = async (pin) => {
        setPinEntryVisible(false);
        try {
            await checkPin(pin);
            await enablePinBiometric(pin);
        } catch {
            Alert.alert(t('Буруу PIN', 'Wrong PIN'), t('PIN буруу байна', 'Incorrect PIN'));
        }
    };

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <SafeAreaView edges={['top']}>
                <View style={[styles.header, {backgroundColor: colors.background, borderColor: colors.border}]}>
                    <Text style={[styles.headerTitle, {color: colors.text}]}>{t('Тохиргоо', 'Settings')}</Text>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.body}>
                <Text style={[styles.sectionLabel, {color: colors.muted}]}>{t('Аюулгүй байдал', 'Security')}</Text>
                <View style={[styles.section, {backgroundColor: colors.surface}]}>
                    <MenuItem
                        icon={<LockIcon size={20} color={colors.primary}/>}
                        label={t('PIN тохиргоо', 'PIN Settings')}
                        onPress={onOpenPin}
                        colors={colors}
                    />
                </View>

                {isAvailable ? (
                    <View style={[styles.section, {backgroundColor: colors.surface}]}>
                        <View style={styles.menuItem}>
                            <View style={[styles.menuIcon, {backgroundColor: colors.accentLight}]}>
                                <FaceIdIcon size={20} color={colors.primary}/>
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={[styles.menuLabel, {color: colors.text}]}>
                                    {t('Face ID тохиргоо', 'Face ID Settings')}
                                </Text>
                            </View>
                            <Switch
                                value={isPinEnabled}
                                onValueChange={handleBiometricToggle}
                                trackColor={{false: colors.border, true: colors.primary}}
                                thumbColor="#fff"
                                ios_backgroundColor={colors.border}
                            />
                        </View>
                    </View>
                ) : null}


                <Text style={[styles.sectionLabel, {color: colors.muted}]}>{t('Харагдац', 'Appearance')}</Text>
                <View style={[styles.section, {backgroundColor: colors.surface}]}>
                    <MenuItem
                        icon={<LanguageIcon size={20} color={colors.primary}/>}
                        label={t('Хэлний тохиргоо', 'Language')}
                        sub={lang === 'mn' ? 'Монгол' : 'English'}
                        onPress={onOpenLanguage}
                        colors={colors}
                    />
                </View>
                <View style={[styles.section, {backgroundColor: colors.surface}]}>
                    <MenuItem
                        icon={<ColorPaletteIcon size={20} color={colors.primary}/>}
                        label={t('Өнгөний тохиргоо', 'Theme')}
                        sub={themeName}
                        onPress={onOpenTheme}
                        colors={colors}
                    />
                </View>
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <TouchableOpacity
                    style={styles.logoutBtn}
                    activeOpacity={0.7}
                    onPress={() =>
                        Alert.alert(
                            t('Гарах', 'Logout'),
                            t('Системээс гарахдаа итгэлтэй байна уу?', 'Are you sure you want to logout?'),
                            [
                                {text: t('Болих', 'Cancel'), style: 'cancel'},
                                {text: t('Гарах', 'Logout'), style: 'destructive', onPress: onLogout},
                            ]
                        )
                    }
                >
                    <LogoutIcon size={18} color={colors.danger}/>
                    <Text style={[styles.logoutText, {color: colors.danger}]}>{t('Гарах', 'Logout')}</Text>
                </TouchableOpacity>
            </SafeAreaView>

            <PinBottomSheet
                visible={pinEntryVisible}
                onConfirm={handlePinEntryConfirm}
                onClose={() => setPinEntryVisible(false)}
                title={t('Одоогийн PIN оруулна уу', 'Enter your current PIN')}
                useBiometricPin={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    headerTitle: {fontSize: 22, fontWeight: '800'},
    body: {padding: 16, paddingBottom: 40},
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    section: {
        borderRadius: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 14,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {fontSize: 15, fontWeight: '600', marginBottom: 2},
    menuSub: {fontSize: 12},
    menuChevron: {fontSize: 22, lineHeight: 26},
    footer: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 8,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 16,
        paddingVertical: 15,
    },
    logoutText: {fontSize: 15, fontWeight: '600'},
});
