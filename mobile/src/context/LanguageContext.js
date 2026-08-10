import {createContext, useCallback, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'app_language';
export const LANGUAGES = {MN: 'mn', EN: 'en'};

const LanguageContext = createContext({
    lang: LANGUAGES.MN,
    setLang: () => {},
    t: (mn, en) => mn,
});

export function LanguageProvider({children}) {
    const [lang, setLangState] = useState(LANGUAGES.MN);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
            if (stored === LANGUAGES.EN || stored === LANGUAGES.MN) setLangState(stored);
        });
    }, []);

    const setLang = useCallback(async (newLang) => {
        setLangState(newLang);
        await AsyncStorage.setItem(STORAGE_KEY, newLang);
    }, []);

    const t = useCallback((mn, en) => lang === LANGUAGES.EN ? en : mn, [lang]);

    return (
        <LanguageContext.Provider value={{lang, setLang, t}}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);