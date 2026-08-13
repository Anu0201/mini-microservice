import {useEffect, useMemo, useRef} from 'react';
import {Animated, Dimensions, PanResponder, StyleSheet, View} from 'react-native';
import {Text} from '@gluestack-ui/themed';
import {CURRENCY_SIGN, getCurrencyBg} from '../constants';
import {useTheme} from '../context/ThemeContext';

const CARD_WIDTH = Dimensions.get('window').width - 40;

export default function AccountCarousel({accounts, index, onIndexChange, onDragStateChange}) {
    const {colors} = useTheme();
    const translateX = useRef(new Animated.Value(-CARD_WIDTH)).current;
    const len = accounts.length;

    useEffect(() => {
        translateX.setValue(-CARD_WIDTH);
    }, [index, len]);

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderGrant: () => {
            onDragStateChange?.(true);
        },
        onPanResponderMove: (_, g) => {
            translateX.setValue(-CARD_WIDTH + g.dx);
        },
        onPanResponderRelease: (_, g) => {
            onDragStateChange?.(false);
            const DISTANCE_THRESHOLD = CARD_WIDTH * 0.4;
            const VELOCITY_THRESHOLD = 0.35;
            const MIN_FLICK_DISTANCE = 24;

            const goNext = len > 1 && (
                g.dx <= -DISTANCE_THRESHOLD ||
                (g.dx <= -MIN_FLICK_DISTANCE && g.vx <= -VELOCITY_THRESHOLD)
            );
            const goPrev = len > 1 && (
                g.dx >= DISTANCE_THRESHOLD ||
                (g.dx >= MIN_FLICK_DISTANCE && g.vx >= VELOCITY_THRESHOLD)
            );

            if (goNext) {
                Animated.timing(translateX, {
                    toValue: -CARD_WIDTH * 2,
                    duration: 220,
                    useNativeDriver: true,
                }).start(({finished}) => {
                    if (!finished) return;
                    onIndexChange((index + 1) % len);
                    translateX.setValue(-CARD_WIDTH);
                });
            } else if (goPrev) {
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 220,
                    useNativeDriver: true,
                }).start(({finished}) => {
                    if (!finished) return;
                    onIndexChange((index - 1 + len) % len);
                    translateX.setValue(-CARD_WIDTH);
                });
            } else {
                Animated.spring(translateX, {
                    toValue: -CARD_WIDTH,
                    useNativeDriver: true,
                    bounciness: 6,
                }).start();
            }
        },
        onPanResponderTerminate: () => {
            onDragStateChange?.(false);
            Animated.spring(translateX, {
                toValue: -CARD_WIDTH,
                useNativeDriver: true,
                bounciness: 6,
            }).start();
        },
    }), [index, len, onIndexChange, onDragStateChange, translateX]);

    if (len === 0) return null;

    const prevAccount = accounts[(index - 1 + len) % len];
    const currentAccount = accounts[index];
    const nextAccount = accounts[(index + 1) % len];

    const renderCard = (account, key) => {
        const currencySymbol = CURRENCY_SIGN[account.currency] ?? account.currency;
        return (
            <View key={key} style={[styles.accountCard, {width: CARD_WIDTH, borderColor: colors.accent, backgroundColor: colors.accentLight}]}>
                <View style={[styles.badge, {backgroundColor: getCurrencyBg(account.currency, colors)}]}>
                    <Text style={styles.badgeText}>{account.currency}</Text>
                </View>
                <View style={{flex: 1}}>
                    <Text style={[styles.accNum, {color: colors.muted}]}>{account.accountNumber}</Text>
                    <Text style={[styles.accBal, {color: colors.text}]}>
                        {Number(account.balance).toLocaleString()} {currencySymbol}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View>
            <View style={[styles.carouselViewport, {width: CARD_WIDTH}]} {...panResponder.panHandlers}>
                <Animated.View style={[styles.carouselTrack, {transform: [{translateX}]}]}>
                    {renderCard(prevAccount, 'prev')}
                    {renderCard(currentAccount, 'current')}
                    {renderCard(nextAccount, 'next')}
                </Animated.View>
            </View>
            {len > 1 && (
                <View style={styles.dotsRow}>
                    {accounts.map((_, i) => (
                        <View key={i} style={[styles.dot, {backgroundColor: colors.border}, i === index && {backgroundColor: colors.accent, width: 16}]}/>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    carouselViewport: {overflow: 'hidden', alignSelf: 'center'},
    carouselTrack: {flexDirection: 'row'},
    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    badge: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12},
    badgeText: {color: '#fff', fontWeight: '700', fontSize: 11},
    accNum: {fontSize: 12, marginBottom: 2},
    accBal: {fontSize: 16, fontWeight: '700'},
    dotsRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 6},
    dot: {width: 6, height: 6, borderRadius: 3},
});