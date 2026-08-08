import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { getTranslation, TranslationKey, Language } from '../utils/i18n';

export type ThemeMode = 'system' | 'light' | 'dark';
export type AppLanguage = 'tr' | 'en';

export interface ThemeColors {
  bg: string;
  cardBg: string;
  cardBorder: string;
  text: string;
  subText: string;
  mutedText: string;
  primary: string;
  primaryBg: string;
  border: string;
  inputBg: string;
  headerBg: string;
  headerBorder: string;
  modalBg: string;
  overlayBg: string;
  badgeBg: string;
  badgeText: string;
}

export const LIGHT_COLORS: ThemeColors = {
  bg: '#FFFFFF',
  cardBg: '#F8F9FA',
  cardBorder: '#E2E8F0',
  text: '#1E293B',
  subText: '#64748B',
  mutedText: '#94A3B8',
  primary: '#7B2CBF',
  primaryBg: 'rgba(123, 44, 191, 0.08)',
  border: '#F1F5F9',
  inputBg: '#F8F9FA',
  headerBg: '#FFFFFF',
  headerBorder: '#F1F5F9',
  modalBg: '#FFFFFF',
  overlayBg: 'rgba(15, 23, 42, 0.6)',
  badgeBg: '#F3E8FF',
  badgeText: '#7B2CBF',
};

export const DARK_COLORS: ThemeColors = {
  bg: '#0F172A',
  cardBg: '#1E293B',
  cardBorder: '#334155',
  text: '#FFFFFF',
  subText: '#CBD5E1',
  mutedText: '#94A3B8',
  primary: '#9D4EDD',
  primaryBg: 'rgba(157, 78, 221, 0.2)',
  border: '#334155',
  inputBg: '#1E293B',
  headerBg: '#0F172A',
  headerBorder: '#1E293B',
  modalBg: '#1E293B',
  overlayBg: 'rgba(0, 0, 0, 0.8)',
  badgeBg: 'rgba(157, 78, 221, 0.25)',
  badgeText: '#C4B5FD',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  isDark: boolean;
  colors: ThemeColors;
  t: (key: TranslationKey) => string;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  setThemeMode: () => {},
  language: 'tr',
  setLanguage: () => {},
  isDark: false,
  colors: LIGHT_COLORS,
  t: (key: TranslationKey) => key,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [language, setLanguageState] = useState<AppLanguage>('tr');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedTheme = window.localStorage.getItem('tavsi_theme') as ThemeMode;
        const savedLang = window.localStorage.getItem('tavsi_lang') as AppLanguage;
        if (savedTheme) setThemeModeState(savedTheme);
        if (savedLang) setLanguageState(savedLang);
      }
    } catch (e) {}
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('tavsi_theme', mode);
      }
    } catch (e) {}
  };

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('tavsi_lang', lang);
      }
    } catch (e) {}
  };

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const t = useCallback(
    (key: TranslationKey) => {
      return getTranslation(key, language as Language);
    },
    [language]
  );

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        language,
        setLanguage,
        isDark,
        colors,
        t,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
