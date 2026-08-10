import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '@gluestack-ui/themed';
import {COLORS} from '../../../constants';
import {useLanguage, LANGUAGES} from '../../../context/LanguageContext';
import {FlagMN, FlagUS} from '../../../components/flags';

const OPTIONS = [
    {
        lang: LANGUAGES.MN,
        FlagComponent: FlagMN,
        name: 'Монгол',
        native: 'Mongolian',
    },
    {
        lang: LANGUAGES.EN,
        FlagComponent: FlagUS,
        name: 'English',
        native: 'Англи',
    },
];

export default function LanguageSettingsScreen({onBack}) {
    const {lang, setLang, t} = useLanguage();

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                        <Text style={styles.backArrow}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('Хэлний тохиргоо', 'Language')}</Text>
                    <View style={{width: 32}}/>
                </View>
            </SafeAreaView>

            <View style={styles.body}>
                <Text style={styles.hint}>
                    {t(
                        'Сонгосон хэл нь апп, серверийн мэдэгдлүүдэд хамаарна.',
                        'The selected language applies to the app and server messages.'
                    )}
                </Text>

                <View style={styles.optionList}>
                    {OPTIONS.map((opt) => {
                        const active = lang === opt.lang;
                        return (
                            <TouchableOpacity
                                key={opt.lang}
                                style={[styles.option, active && styles.optionActive]}
                                onPress={() => setLang(opt.lang)}
                                activeOpacity={0.75}
                            >
                                <View style={styles.flagWrap}>
                                    <opt.FlagComponent size={36}/>
                                </View>
                                <View style={{flex: 1}}>
                                    <Text style={[styles.optionName, active && styles.optionNameActive]}>
                                        {opt.name}
                                    </Text>
                                    <Text style={styles.optionNative}>{opt.native}</Text>
                                </View>
                                <View style={[styles.radio, active && styles.radioActive]}>
                                    {active && <View style={styles.radioDot}/>}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f8fafc'},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    backArrow: {fontSize: 32, color: '#0f172a', lineHeight: 36, width: 32},
    headerTitle: {fontSize: 17, fontWeight: '700', color: '#0f172a'},
    body: {padding: 16},
    hint: {
        fontSize: 13,
        color: COLORS.secondary,
        marginBottom: 20,
        lineHeight: 19,
        paddingHorizontal: 4,
    },
    optionList: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 14,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    optionActive: {backgroundColor: '#f0f9ff'},
    flagWrap: {width: 36, height: 36, borderRadius: 6, overflow: 'hidden'},
    optionName: {fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 2},
    optionNameActive: {color: COLORS.primary},
    optionNative: {fontSize: 12, color: COLORS.muted},
    radio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: '#cbd5e1',
        alignItems: 'center', justifyContent: 'center',
    },
    radioActive: {borderColor: COLORS.primary},
    radioDot: {width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.primary},
});