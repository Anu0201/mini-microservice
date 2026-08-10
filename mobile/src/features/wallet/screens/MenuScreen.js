import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '@gluestack-ui/themed';
import {COLORS} from '../../../constants';
import {LockIcon} from '../../../components/icons';
import {useLanguage} from '../../../context/LanguageContext';

function MenuItem({icon, label, sub, onPress, chevron = true}) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.72}>
            <View style={styles.menuIcon}>{icon}</View>
            <View style={{flex: 1}}>
                <Text style={styles.menuLabel}>{label}</Text>
                {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
            </View>
            {chevron && <Text style={styles.menuChevron}>›</Text>}
        </TouchableOpacity>
    );
}

export default function MenuScreen({onOpenPin, onOpenLanguage}) {
    const {t, lang} = useLanguage();

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('Тохиргоо', 'Settings')}</Text>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.body}>
                <Text style={styles.sectionLabel}>{t('Аюулгүй байдал', 'Security')}</Text>
                <View style={styles.section}>
                    <MenuItem
                        icon={<LockIcon size={20} color={COLORS.primary}/>}
                        label={t('PIN тохиргоо', 'PIN Settings')}
                        sub={t('Гүйлгээний PIN удирдах', 'Manage transaction PIN')}
                        onPress={onOpenPin}
                    />
                </View>

                <Text style={styles.sectionLabel}>{t('Харагдац', 'Appearance')}</Text>
                <View style={styles.section}>
                    <MenuItem
                        icon={<GlobeIcon/>}
                        label={t('Хэлний тохиргоо', 'Language')}
                        sub={lang === 'mn' ? 'Монгол' : 'English'}
                        onPress={onOpenLanguage}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

function GlobeIcon() {
    return (
        <Text style={styles.globeEmoji}>🌐</Text>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f8fafc'},
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    headerTitle: {fontSize: 22, fontWeight: '800', color: '#0f172a'},
    body: {padding: 16, paddingBottom: 40},
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    section: {
        backgroundColor: '#fff',
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
        backgroundColor: '#f0f9ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 2},
    menuSub: {fontSize: 12, color: COLORS.secondary},
    menuChevron: {fontSize: 22, color: COLORS.muted, lineHeight: 26},
    globeEmoji: {fontSize: 20},
});