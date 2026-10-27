const storage = typeof localStorage === 'undefined' ? null : localStorage;

export const getPreference = async (key: string) => storage?.getItem(key) ?? null;
export const setPreference = async (key: string, value: string) => { storage?.setItem(key, value); };
