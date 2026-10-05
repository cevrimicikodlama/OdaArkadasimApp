let accessToken: string | null = null;

export const getAccessToken = async () => accessToken;
export const saveAccessToken = async (token: string) => { accessToken = token; };
export const deleteAccessToken = async () => { accessToken = null; };