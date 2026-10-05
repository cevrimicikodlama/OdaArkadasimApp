import * as SecureStore from 'expo-secure-store';

const tokenKey = 'oda-arkadasim-access-token';

export const getAccessToken = () => SecureStore.getItemAsync(tokenKey);
export const saveAccessToken = (token: string) => SecureStore.setItemAsync(tokenKey, token);
export const deleteAccessToken = () => SecureStore.deleteItemAsync(tokenKey);