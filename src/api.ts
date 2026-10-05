import { deleteAccessToken, getAccessToken, saveAccessToken } from './auth-token';

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api').replace(/\/$/, '');

export type UserAccount = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string | null;
  bio: string | null;
  created_at: string;
};

export type RegisterInput = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  birth_date: string | null;
  bio: string | null;
};

export type ApiListing = {
  id: number;
  userId: number;
  type: 'HAVE_ROOM' | 'NEED_ROOM';
  title: string;
  description: string;
  city: string;
  district: string;
  price: number;
  status: 'ACTIVE' | 'CLOSED';
  created_at: string;
  ownerName: string;
  age: number | null;
  occupation: string;
  tags: string[];
  image: string | null;
};

export type ApiOffer = {
  id: number;
  listingId: number;
  listingTitle: string;
  applicantName: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  direction: 'incoming' | 'outgoing';
  created_at: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error('API sunucusuna ulaşılamadı. Sunucuyu, ağ adresini ve cihaz bağlantısını kontrol et.');
  }
  const result = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) throw new Error(result?.error || `API isteği başarısız (${response.status}).`);
  return result as T;
}

export async function register(input: RegisterInput) {
  const result = await request<{ user: UserAccount; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  await saveAccessToken(result.token);
  return result.user;
}

export async function login(email: string, password: string) {
  const result = await request<{ user: UserAccount; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await saveAccessToken(result.token);
  return result.user;
}

export async function logout() {
  await deleteAccessToken();
}

export const getCurrentUser = () => request<{ user: UserAccount }>('/auth/me');
export const getListings = () => request<{ listings: ApiListing[] }>('/listings');
export const getOffers = () => request<{ offers: ApiOffer[] }>('/offers');

export const createListing = (listing: Omit<ApiListing, 'id' | 'userId' | 'status' | 'created_at' | 'ownerName' | 'age' | 'occupation' | 'tags' | 'image'>) =>
  request<{ listing: ApiListing }>('/listings', { method: 'POST', body: JSON.stringify(listing) });

export const createOffer = (listingId: number, message: string) =>
  request<{ id: number; status: 'PENDING' }>('/offers', {
    method: 'POST',
    body: JSON.stringify({ listing_id: listingId, message }),
  });

export const updateOfferStatus = (offerId: number, status: 'ACCEPTED' | 'REJECTED') =>
  request<{ id: number; status: 'ACCEPTED' | 'REJECTED' }>(`/offers/${offerId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });