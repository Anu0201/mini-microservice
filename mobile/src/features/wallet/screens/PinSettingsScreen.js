import {useEffect, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {Spinner} from '@gluestack-ui/themed';
import PinEntryScreen from '../../../components/PinEntryScreen';
import {usePinSettings} from '../hooks/usePinSettings';
import {useLanguage} from '../../../context/LanguageContext';
import {useTheme} from '../../../context/ThemeContext';

export default function PinSettingsScreen({onBack, onSuccess}) {
    const {t} = useLanguage();
    const {colors} = useTheme();
    const {
        hasPinSet, loading, fetched, load,
        pinVisible, pinScreenTitle, pinTitle, submitting, successMsg, setSuccessMsg,
        startCreate, startChange, closePin, handlePinConfirm,
    } = usePinSettings({onPinCreated: onSuccess});

    const autoTriggered = useRef(false);

    useEffect(() => {
        if (!fetched && !loading) load();
    }, []);

    useEffect(() => {
        if (fetched && !loading && !autoTriggered.current) {
            autoTriggered.current = true;
            if (hasPinSet) startChange();
            else startCreate();
        }
    }, [fetched, loading, hasPinSet]);

    useEffect(() => {
        if (!successMsg) return;
        const timer = setTimeout(() => setSuccessMsg(''), 3000);
        return () => clearTimeout(timer);
    }, [successMsg]);

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            {!fetched && (
                <View style={styles.center}>
                    <Spinner size="large" color={colors.primary}/>
                </View>
            )}
            <PinEntryScreen
                visible={pinVisible}
                screenTitle={pinScreenTitle}
                label={pinTitle}
                onConfirm={handlePinConfirm}
                onClose={() => {
                    closePin();
                    onBack?.();
                }}
                loading={submitting}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});