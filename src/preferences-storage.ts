import * as SecureStore from 'expo-secure-store';

export const getPreference = (key: string) => SecureStore.getItemAsync(key);
export const setPreference = (key: string, value: string) => SecureStore.setItemAsync(key, value);
