import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Güvenli Hibrit Depolama Adaptörü (Web / Native)
const CustomStorageAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {}
      return null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {}
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {}
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {}
  },
};

// Supabase Proje Bilgileri
const supabaseUrl = 'https://whisegvjblycobvarfpj.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZqUrpHoKIOUyFNc42-UMSw_l4IcbAqZ';

// Supabase istemcisini oluştur
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: CustomStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
