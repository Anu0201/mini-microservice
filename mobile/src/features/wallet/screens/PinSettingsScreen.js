import {useEffect} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Spinner, Text} from '@gluestack-ui/themed';
import {COLORS} from '../../../constants';
import {LockIcon} from '../../../components/icons';
import PinBottomSheet from '../../../components/PinBottomSheet';
import {usePinSettings} from '../hooks/usePinSettings';

export default function PinSettingsScreen({onBack}) {
    const {
        hasPinSet, loading, fetched, load,
        pinVisible, pinTitle, submitting, successMsg, setSuccessMsg,
        startCreate, startChange, startRecover, closePin, handlePinConfirm,
    } = usePinSettings();

    useEffect(() => {
        if (!fetched && !loading) load();
    }, []);

    useEffect(() => {
        if (!successMsg) return;
        const t = setTimeout(() => setSuccessMsg(''), 3000);
        return () => clearTimeout(t);
    }, [successMsg]);

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        {onBack && (
                            <TouchableOpacity onPress={onBack} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                                <Text style={styles.backArrow}>‹</Text>
                            </TouchableOpacity>
                        )}
                        <View style={styles.headerCenter}>
                            <View style={[styles.iconCircle, hasPinSet && styles.iconCircleActive]}>
                                <LockIcon size={32} color="#fff"/>
                            </View>
                            <Text style={styles.headerTitle}>PIN тохиргоо</Text>

                            {loading ? (
                                <Spinner size="small" color="rgba(255,255,255,0.7)" style={{marginTop: 8}}/>
                            ) : (
                                <View style={styles.statusPill}>
                                    <View style={[styles.statusDot, hasPinSet ? styles.dotOn : styles.dotOff]}/>
                                    <Text style={styles.statusText}>
                                        {hasPinSet ? 'PIN тохируулсан' : 'PIN тохируулаагүй'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        {onBack && <View style={{width: 32}}/>}
                    </View>
                </SafeAreaView>
            </View>

            <View style={styles.body}>

                {successMsg ? (
                    <View style={styles.successBanner}>
                        <Text style={styles.successIcon}>✓</Text>
                        <Text style={styles.successText}>{successMsg}</Text>
                    </View>
                ) : null}

                {!loading && (
                    <>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={hasPinSet ? startChange : startCreate}
                            activeOpacity={0.82}
                        >
                            <Text style={styles.primaryBtnText}>
                                {hasPinSet ? 'PIN шинэчлэх' : 'PIN үүсгэх'}
                            </Text>
                        </TouchableOpacity>

                        {hasPinSet && (
                            <TouchableOpacity
                                style={styles.recoverBtn}
                                onPress={startRecover}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.recoverBtnText}>PIN мартсан?</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.infoCard}>
                            <Text style={styles.infoTitle}>Мэдээлэл</Text>
                            <InfoRow text="4 оронтой тоо байна"/>
                            <InfoRow text="Буруу 5 удаа оруулбал 15 минутаар түгжигдэнэ"/>
                        </View>
                    </>
                )}
            </View>

            <PinBottomSheet
                visible={pinVisible}
                title={pinTitle}
                onConfirm={handlePinConfirm}
                onClose={closePin}
                loading={submitting}
            />
        </View>
    );
}

function InfoRow({text}) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoDot}/>
            <Text style={styles.infoText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f8fafc'},

    header: {
        backgroundColor: COLORS.primary,
        paddingBottom: 28,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 14,
    },
    backArrow: {fontSize: 32, color: '#fff', lineHeight: 36, width: 32},
    headerCenter: {flex: 1, alignItems: 'center', paddingTop: 12},
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    iconCircleActive: {
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderColor: 'rgba(255,255,255,0.45)',
    },
    headerTitle: {fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 10},
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    statusDot: {width: 8, height: 8, borderRadius: 4},
    dotOn: {backgroundColor: '#4ade80'},
    dotOff: {backgroundColor: 'rgba(255,255,255,0.45)'},
    statusText: {fontSize: 13, fontWeight: '600', color: '#fff'},

    body: {flex: 1, padding: 20},

    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#dcfce7',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 13,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#86efac',
    },
    successIcon: {fontSize: 16, color: '#15803d'},
    successText: {fontSize: 14, fontWeight: '600', color: '#15803d', flex: 1},

    primaryBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 4},
        elevation: 4,
    },
    primaryBtnText: {color: '#fff', fontSize: 17, fontWeight: '700'},

    recoverBtn: {alignItems: 'center', paddingVertical: 10, marginBottom: 6},
    recoverBtnText: {fontSize: 14, color: COLORS.secondary, textDecorationLine: 'underline'},

    infoCard: {
        marginTop: 24,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    infoTitle: {fontSize: 12, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12},
    infoRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8},
    infoDot: {width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.accent, marginTop: 6},
    infoText: {fontSize: 13, color: COLORS.secondary, flex: 1, lineHeight: 19},
});