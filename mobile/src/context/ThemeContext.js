import {createContext, useCallback, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (username) => `theme_${username}`;
const LAST_THEME_KEY = 'theme_last';

export const THEMES = [
    {
        id: 'lavender',
        swatches: ['#F4EEFF', '#DCD6F7', '#A6B1E1', '#424874'],
        colors: {
            background: '#F4EEFF',
            surface: '#FFFFFF',
            card: '#F4EEFF',
            primary: '#424874',
            primaryLight: '#A6B1E1',
            accent: '#A6B1E1',
            accentLight: '#F4EEFF',
            text: '#1a1a2e',
            textOnPrimary: '#FFFFFF',
            muted: '#7878B0',
            secondary: '#5A6094',
            border: '#DCD6F7',
            convertBg: '#DCD6F7',
            convertText: '#424874',
            toggleBg: '#DCD6F7',
            success: '#16a34a',
            danger: '#ef4444',
            isDark: false,
        },
    },
    {
        id: 'rose',
        swatches: ['#F9F5F6', '#F8E8EE', '#FDCEDF', '#F2BED1'],
        colors: {
            background: '#F9F5F6',
            surface: '#FFFFFF',
            card: '#F8E8EE',
            primary: '#C2536A',
            primaryLight: '#FDCEDF',
            accent: '#F2BED1',
            accentLight: '#F9F5F6',
            text: '#2D1020',
            textOnPrimary: '#FFFFFF',
            muted: '#B07090',
            secondary: '#8A5070',
            border: '#F2BED1',
            convertBg: '#F8E8EE',
            convertText: '#C2536A',
            toggleBg: '#FDCEDF',
            success: '#16a34a',
            danger: '#ef4444',
            isDark: false,
        },
    },
    {
        id: 'ocean',
        swatches: ['#E3F2FD', '#90CAF9', '#2196F3', '#0D47A1'],
        colors: {
            background: '#E3F2FD',
            surface: '#FFFFFF',
            card: '#BBDEFB',
            primary: '#1565C0',
            primaryLight: '#90CAF9',
            accent: '#2196F3',
            accentLight: '#E3F2FD',
            text: '#0D2B5E',
            textOnPrimary: '#FFFFFF',
            muted: '#5C85B5',
            secondary: '#1565C0',
            border: '#90CAF9',
            convertBg: '#E3F2FD',
            convertText: '#1565C0',
            toggleBg: '#90CAF9',
            success: '#16a34a',
            danger: '#ef4444',
            isDark: false,
        },
    },
    {
        id: 'meadow',
        swatches: ['#A8DF8E', '#F0FFDF', '#FFD8DF', '#FFAAB8'],
        colors: {
            background: '#F0FFDF',
            surface: '#FFFFFF',
            card: '#F0FFDF',
            primary: '#5D9B50',
            primaryLight: '#A8DF8E',
            accent: '#FFAAB8',
            accentLight: '#FFD8DF',
            text: '#1A2E1A',
            textOnPrimary: '#FFFFFF',
            muted: '#7A9B6A',
            secondary: '#4A7A3D',
            border: '#A8DF8E',
            convertBg: '#FFD8DF',
            convertText: '#C44D6F',
            toggleBg: '#A8DF8E',
            success: '#16a34a',
            danger: '#ef4444',
            isDark: false,
        },
    },
    {
        id: 'sunset',
        swatches: ['#FFAB73', '#FFD384', '#FFF9B0', '#FFAEC0'],
        colors: {
            background: '#FFF9B0',
            surface: '#FFFFFF',
            card: '#FFF9B0',
            primary: '#E8793A',
            primaryLight: '#FFAB73',
            accent: '#FFAEC0',
            accentLight: '#FFF9B0',
            text: '#2D1B0E',
            textOnPrimary: '#FFFFFF',
            muted: '#A08060',
            secondary: '#7A5540',
            border: '#FFD384',
            convertBg: '#FFD384',
            convertText: '#7A3B00',
            toggleBg: '#FFD384',
            success: '#16a34a',
            danger: '#ef4444',
            isDark: false,
        },
    },
    {
        id: 'dark',
        swatches: ['#222831', '#393E46', '#00ADB5', '#EEEEEE'],
        colors: {
            background: '#222831',
            surface: '#393E46',
            card: '#393E46',
            primary: '#00ADB5',
            primaryLight: '#00CDD4',
            accent: '#00ADB5',
            accentLight: '#1A3A3C',
            text: '#EEEEEE',
            textOnPrimary: '#222831',
            muted: '#8899AA',
            secondary: '#AABBCC',
            border: '#4A5260',
            convertBg: '#1A3A3C',
            convertText: '#00ADB5',
            toggleBg: '#1A3A3C',
            success: '#4CAF50',
            danger: '#EF5350',
            isDark: true,
        },
    },
];

const DEFAULT_THEME = THEMES[0];

const ThemeContext = createContext({
    theme: DEFAULT_THEME,
    colors: DEFAULT_THEME.colors,
    setThemeById: () => {},
    loadThemeForUser: () => {},
    resetTheme: () => {},
});

export function ThemeProvider({children}) {
    const [theme, setTheme] = useState(DEFAULT_THEME);
    const [currentUsername, setCurrentUsername] = useState(null);

    useEffect(() => {
        (async () => {
            const username = await AsyncStorage.getItem('username');
            const key = username ? storageKey(username) : LAST_THEME_KEY;
            if (username) setCurrentUsername(username);
            const stored = await AsyncStorage.getItem(key);
            if (stored) {
                const found = THEMES.find(t => t.id === stored);
                if (found) setTheme(found);
            }
        })();
    }, []);

    const loadThemeForUser = useCallback(async (username) => {
        setCurrentUsername(username);
        const stored = await AsyncStorage.getItem(storageKey(username));
        const found = stored ? THEMES.find(t => t.id === stored) : null;
        setTheme(found ?? DEFAULT_THEME);
    }, []);

    const resetTheme = useCallback(() => {
        setCurrentUsername(null);
    }, []);

    const setThemeById = useCallback(async (id) => {
        const found = THEMES.find(t => t.id === id);
        if (!found) return;
        setTheme(found);
        await AsyncStorage.setItem(LAST_THEME_KEY, id);
        if (currentUsername) {
            await AsyncStorage.setItem(storageKey(currentUsername), id);
        }
    }, [currentUsername]);

    return (
        <ThemeContext.Provider value={{theme, colors: theme.colors, setThemeById, loadThemeForUser, resetTheme}}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);