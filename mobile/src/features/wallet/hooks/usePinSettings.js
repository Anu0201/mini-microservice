import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {getMe} from '../../../services/userApi';
import {createPin, changePin, recoverPin, checkPin} from '../../../services/pinApi';

export const usePinSettings = () => {
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
            Alert.alert('Алдаа', 'Мэдээлэл татаж чадсангүй');
        } finally {
            setLoading(false);
        }
    }, []);

    const startCreate = () => { setFlow('create'); setStep('new'); setPendingPin(''); setSuccessMsg(''); };
    const startChange = () => { setFlow('change'); setStep('current'); setPendingPin(''); setSuccessMsg(''); };
    const startRecover = () => { setFlow('recover'); setStep('new'); setPendingPin(''); setSuccessMsg(''); };

    const closePin = () => { setFlow(null); setStep(null); setPendingPin(''); };

    const pinTitle = () => {
        if (flow === 'change' && step === 'current') return 'Одоогийн PIN оруулна уу';
        if (step === 'confirm') return 'PIN давтан оруулна уу';
        if (flow === 'create') return 'Шинэ PIN оруулна уу';
        if (flow === 'change') return 'Шинэ PIN оруулна уу';
        if (flow === 'recover') return 'Шинэ PIN оруулна уу';
        return 'PIN оруулна уу';
    };

    const handlePinConfirm = async (pin) => {
        if (flow === 'change' && step === 'current') {
            setSubmitting(true);
            try {
                await checkPin(pin);
                setStep('new');
            } catch (e) {
                closePin();
                Alert.alert('Буруу PIN', e.response?.data?.message || 'PIN буруу байна');
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
                Alert.alert('Тохирохгүй байна', 'PIN тохирохгүй байна. Дахин оруулна уу.');
                return;
            }
            setSubmitting(true);
            try {
                if (flow === 'create') await createPin(pin);
                else if (flow === 'change') await changePin(pin);
                else if (flow === 'recover') await recoverPin(pin);
                setHasPinSet(true);
                setSuccessMsg(flow === 'create' ? 'PIN амжилттай үүслээ' : 'PIN амжилттай солигдлоо');
                closePin();
            } catch (e) {
                closePin();
                Alert.alert('Алдаа', e.response?.data?.message || 'Алдаа гарлаа');
            } finally {
                setSubmitting(false);
            }
        }
    };

    return {
        hasPinSet, loading, fetched, load,
        flow, step, submitting, successMsg, setSuccessMsg,
        pinVisible: !!flow,
        pinTitle: pinTitle(),
        startCreate, startChange, startRecover, closePin, handlePinConfirm,
    };
};