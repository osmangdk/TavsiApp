import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const SECURE_CHUNK_SIZE = 1800;
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const toSecureKey = (key: string) => `tavsi.${key.replace(/[^A-Za-z0-9._-]/g, '_')}`;

const getSecureChunkCount = async (key: string) => {
  const rawCount = await SecureStore.getItemAsync(`${toSecureKey(key)}.count`, SECURE_STORE_OPTIONS);
  const count = Number(rawCount);
  return Number.isInteger(count) && count > 0 ? count : 0;
};

const readSecureValue = async (key: string) => {
  const secureKey = toSecureKey(key);
  const chunkCount = await getSecureChunkCount(key);
  if (!chunkCount) return null;

  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) =>
      SecureStore.getItemAsync(`${secureKey}.${index}`, SECURE_STORE_OPTIONS)
    )
  );

  return chunks.every((chunk): chunk is string => chunk !== null) ? chunks.join('') : null;
};

const writeSecureValue = async (key: string, value: string) => {
  const secureKey = toSecureKey(key);
  const previousChunkCount = await getSecureChunkCount(key);
  const chunks = value.match(new RegExp(`.{1,${SECURE_CHUNK_SIZE}}`, 'gs')) || [''];

  await Promise.all(
    chunks.map((chunk, index) =>
      SecureStore.setItemAsync(`${secureKey}.${index}`, chunk, SECURE_STORE_OPTIONS)
    )
  );
  await SecureStore.setItemAsync(`${secureKey}.count`, String(chunks.length), SECURE_STORE_OPTIONS);

  if (previousChunkCount > chunks.length) {
    await Promise.all(
      Array.from({ length: previousChunkCount - chunks.length }, (_, index) =>
        SecureStore.deleteItemAsync(`${secureKey}.${chunks.length + index}`, SECURE_STORE_OPTIONS)
      )
    );
  }
};

const removeSecureValue = async (key: string) => {
  const secureKey = toSecureKey(key);
  const chunkCount = await getSecureChunkCount(key);
  await Promise.all([
    ...Array.from({ length: chunkCount }, (_, index) =>
      SecureStore.deleteItemAsync(`${secureKey}.${index}`, SECURE_STORE_OPTIONS)
    ),
    SecureStore.deleteItemAsync(`${secureKey}.count`, SECURE_STORE_OPTIONS),
  ]);
};

// Web localStorage kullanır; native oturumlar cihazın Keychain/Keystore alanında tutulur.
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
      const securedValue = await readSecureValue(key);
      if (securedValue !== null) return securedValue;

      // Önceki sürümden kalan oturumu bir kez şifreli depoya taşı.
      const legacyValue = await AsyncStorage.getItem(key);
      if (legacyValue !== null) {
        await writeSecureValue(key, legacyValue);
        await AsyncStorage.removeItem(key);
      }
      return legacyValue;
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
      await writeSecureValue(key, value);
      await AsyncStorage.removeItem(key);
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
      await Promise.all([removeSecureValue(key), AsyncStorage.removeItem(key)]);
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
    flowType: 'pkce',
  },
});
