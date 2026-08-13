import {TouchableOpacity, View, StyleSheet} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {MoneyIcon, MenuIcon, ProfileIcon} from './icons';
import {TAB_CONTENT_HEIGHT, TAB_BAR_FALLBACK_PADDING} from '../constants';
import {useLanguage} from '../context/LanguageContext';
import {useTheme} from '../context/ThemeContext';

export default function TabBar({activeTab, onSwitch, glass, liquidGlassView, insets}) {
    const {t} = useLanguage();
    const {colors} = useTheme();

    const TABS = [
        {key: 'profile', label: t('Профайл', 'Profile'), Icon: ProfileIcon, size: 24},
        {key: 'home', label: t('Нүүр', 'Home'), Icon: MoneyIcon, size: 28},
        {key: 'history', label: t('Цэс', 'Menu'), Icon: MenuIcon, size: 28},
    ];

    const iconColor = (tab) => {
        const active = activeTab === tab;
        if (glass) return active ? colors.primary : 'rgba(255,255,255,0.75)';
        return active ? colors.primary : colors.muted;
    };

    const tabBarH = TAB_CONTENT_HEIGHT + (insets.bottom > 0 ? insets.bottom : TAB_BAR_FALLBACK_PADDING);

    const tabItems = (
        <View style={styles.tabRow}>
            {TABS.map(({key, label, Icon, size}) => (
                <TouchableOpacity key={key} style={styles.tabItem} onPress={() => onSwitch(key)} activeOpacity={0.7}>
                    <Icon size={size} color={iconColor(key)}/>
                    <Text style={[
                        styles.tabLabel,
                        {color: colors.muted},
                        activeTab === key && {color: colors.primary, fontWeight: '600'},
                        glass && styles.tabLabelGlass,
                    ]}>
                        {label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    if (glass && liquidGlassView) {
        const LiquidGlassView = liquidGlassView;
        return (
            <View style={[styles.tabBarFloat, {
                height: tabBarH,
                backgroundColor: colors.surface,
                borderColor: colors.border
            }]}>
                <LiquidGlassView
                    style={[styles.glassBar, {paddingBottom: insets.bottom > 0 ? insets.bottom : TAB_BAR_FALLBACK_PADDING}]}
                    effect="regular"
                    colorScheme="system"
                >
                    {tabItems}
                </LiquidGlassView>
            </View>
        );
    }

    return (
        <View style={[
            styles.tabBarFloat,
            {
                paddingBottom: insets.bottom > 0 ? insets.bottom : TAB_BAR_FALLBACK_PADDING,
                backgroundColor: colors.background,
                borderTopColor: colors.background,
            },
        ]}>
            {tabItems}
        </View>
    );
}

const styles = StyleSheet.create({
    tabBarFloat: {position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 2},
    glassBar: {flex: 1, paddingTop: 10, paddingHorizontal: 8},
    tabRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10},
    tabItem: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4},
    tabLabel: {fontSize: 11, marginTop: 2},
    tabLabelGlass: {color: 'rgba(255,255,255,0.75)'},
});
