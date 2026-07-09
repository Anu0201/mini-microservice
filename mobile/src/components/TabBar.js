import {TouchableOpacity, View, StyleSheet} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {MoneyIcon, MenuIcon, ProfileIcon} from './icons';
import {TAB_CONTENT_HEIGHT, TAB_BAR_FALLBACK_PADDING} from '../constants';

const TABS = [
    {key: 'profile', label: 'Профайл', Icon: ProfileIcon, size: 24},
    {key: 'home',    label: 'Нүүр',    Icon: MoneyIcon,   size: 28},
    {key: 'history', label: 'Цэс',     Icon: MenuIcon,    size: 28},
];

export default function TabBar({activeTab, onSwitch, glass, liquidGlassView, insets}) {
    const iconColor = (tab) => {
        const active = activeTab === tab;
        if (glass) return active ? '#B771E5' : 'rgba(255,255,255,0.75)';
        return active ? '#B771E5' : '#94a3b8';
    };

    const tabBarH = TAB_CONTENT_HEIGHT + (insets.bottom > 0 ? insets.bottom : TAB_BAR_FALLBACK_PADDING);

    const tabItems = (
        <View style={styles.tabRow}>
            {TABS.map(({key, label, Icon, size}) => (
                <TouchableOpacity key={key} style={styles.tabItem} onPress={() => onSwitch(key)} activeOpacity={0.7}>
                    <Icon size={size} color={iconColor(key)}/>
                    <Text style={[styles.tabLabel, activeTab === key && styles.tabLabelActive, glass && styles.tabLabelGlass]}>
                        {label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    if (glass && liquidGlassView) {
        const LiquidGlassView = liquidGlassView;
        return (
            <View style={[styles.tabBarFloat, {height: tabBarH}]}>
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
        <View style={[styles.tabBarFloat, {paddingBottom: insets.bottom > 0 ? insets.bottom : TAB_BAR_FALLBACK_PADDING}]}>
            {tabItems}
        </View>
    );
}

const styles = StyleSheet.create({
    tabBarFloat: {position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#f1f5f9'},
    glassBar: {flex: 1, paddingTop: 10, paddingHorizontal: 8},
    tabRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10},
    tabItem: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4},
    tabLabel: {fontSize: 11, color: '#94a3b8', marginTop: 2},
    tabLabelActive: {color: '#B771E5', fontWeight: '600'},
    tabLabelGlass: {color: 'rgba(255,255,255,0.75)'},
});
