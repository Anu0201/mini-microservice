import {TouchableOpacity, View, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '@gluestack-ui/themed';
import {MoneyIcon, MenuIcon, ProfileIcon} from './icons';

const TAB_CONTENT_H = 64;

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

    const tabBarH = TAB_CONTENT_H + (insets.bottom > 0 ? insets.bottom : 12);

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
                    style={[styles.glassBar, {paddingBottom: insets.bottom > 0 ? insets.bottom : 12}]}
                    effect="regular"
                    colorScheme="system"
                >
                    {tabItems}
                </LiquidGlassView>
            </View>
        );
    }

    return (
        <SafeAreaView edges={['bottom']} style={styles.tabBarWrapper}>
            <View style={styles.tabBar}>{tabItems}</View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    tabBarFloat: {position: 'absolute', bottom: 0, left: 0, right: 0},
    glassBar: {flex: 1, paddingTop: 10, paddingHorizontal: 8},
    tabRow: {flexDirection: 'row', alignItems: 'center', height: TAB_CONTENT_H - 10},
    tabBarWrapper: {backgroundColor: '#fff'},
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#fff',
        paddingVertical: 8,
    },
    tabItem: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4},
    tabLabel: {fontSize: 11, color: '#94a3b8', marginTop: 2},
    tabLabelActive: {color: '#B771E5', fontWeight: '600'},
    tabLabelGlass: {color: 'rgba(255,255,255,0.75)'},
});
