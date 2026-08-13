import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {getMe} from '../../../services/userApi';
import {createPin, changePin, recoverPin, checkPin} from '../../../services/pinApi';
import {useLanguage} from '../../../context/LanguageContext';
import {useBiometric} from '../../auth/hooks/useBiometric';

export const usePinSettings = ({onPinCreated} = {}) => {
    const {t} = useLanguage();
    const {updateBiometricPin} = useBiometric();

    const [hasPinSet, setHasPinSet] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const [flow, setFlow] = useState(null);
    const [step, setStep] = useState(null);
    const [pendingPin, setPendingPin] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMe();
            setHasPinSet(res.data.hasPinSet);
            setFetched(true);
        } catch {
            Alert.alert(t('Алдаа', 'Error'), t('Мэдээлэл татаж чадсангүй', 'Failed to load data'));
        } finally {
            setLoading(false);
        }
    }, []);

    const startCreate = () => { setFlow('create'); setStep('new'); setPendingPin(''); setSuccessMsg(''); };
    const startChange = () => { setFlow('change'); setStep('current'); setPendingPin(''); setSuccessMsg(''); };
    const startRecover = () => { setFlow('recover'); setStep('new'); setPendingPin(''); setSuccessMsg(''); };

    const closePin = () => { setFlow(null); setStep(null); setPendingPin(''); };

    const pinScreenTitle = () => {
        if (flow === 'create') return t('PIN үүсгэх', 'Create PIN');
        if (flow === 'change') return t('PIN солих', 'Change PIN');
        if (flow === 'recover') return t('PIN сэргээх', 'Recover PIN');
        return t('PIN', 'PIN');
    };

    const pinTitle = () => {
        if (flow === 'change' && step === 'current') return t('Одоогийн PIN код', 'Current PIN');
        if (step === 'confirm') return t('PIN давтан оруулна уу', 'Confirm your PIN');
        if (flow === 'create') return t('Шинэ PIN код', 'New PIN');
        if (flow === 'change') return t('Шинэ PIN код', 'New PIN');
        if (flow === 'recover') return t('Шинэ PIN код', 'New PIN');
        return t('PIN оруулна уу', 'Enter PIN');
    };

    const handlePinConfirm = async (pin) => {
        if (flow === 'change' && step === 'current') {
            setSubmitting(true);
            try {
                await checkPin(pin);
                setStep('new');
            } catch (e) {
                closePin();
                Alert.alert(t('Буруу PIN', 'Wrong PIN'), e.response?.data?.message || t('PIN буруу байна', 'Incorrect PIN'));
            } finally {
                setSubmitting(false);
            }
            return;
        }

        if (step === 'new') {
            setPendingPin(pin);
            setStep('confirm');
            return;
        }

        if (step === 'confirm') {
            if (pin !== pendingPin) {
                setPendingPin('');
                setStep('new');
                Alert.alert(t('Тохирохгүй байна', 'PIN mismatch'), t('PIN тохирохгүй байна. Дахин оруулна уу.', 'PINs do not match. Please try again.'));
                return;
            }
            setSubmitting(true);
            try {
                if (flow === 'create') await createPin(pin);
                else if (flow === 'change') await changePin(pin);
                else if (flow === 'recover') await recoverPin(pin);
                // Keep biometric PIN in sync whenever PIN is set/changed
                await updateBiometricPin(pin);
                setHasPinSet(true);
                setSuccessMsg(flow === 'create' ? t('PIN амжилттай үүслээ', 'PIN created successfully') : t('PIN амжилттай солигдлоо', 'PIN changed successfully'));
                closePin();
                if (flow === 'create') onPinCreated?.();
            } catch (e) {
                closePin();
                Alert.alert(t('Алдаа', 'Error'), e.response?.data?.message || t('Алдаа гарлаа', 'Something went wrong'));
            } finally {
                setSubmitting(false);
            }
        }
    };

    return {
        hasPinSet, loading, fetched, load,
        flow, step, submitting, successMsg, setSuccessMsg,
        pinVisible: !!flow,
        pinScreenTitle: pinScreenTitle(),
        pinTitle: pinTitle(),
        startCreate, startChange, startRecover, closePin, handlePinConfirm,
    };
};
