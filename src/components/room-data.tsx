import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  createListing as createListingRequest,
  createOffer as createOfferRequest,
  getCurrentUser,
  getListings,
  getOffers,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  updateOfferStatus as updateOfferStatusRequest,
  type ApiListing,
  type ApiOffer,
  type RegisterInput,
  type UserAccount,
} from '@/api';
import { getAccessToken } from '@/auth-token';

export type ListingType = 'HAVE_ROOM' | 'NEED_ROOM';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type RoomListing = {
  id: number;
  userId: number;
  type: ListingType;
  title: string;
  description: string;
  city: string;
  district: string;
  price: number;
  status: 'ACTIVE' | 'CLOSED';
  ownerName: string;
  age: number | null;
  occupation: string;
  tags: string[];
  image: string | null;
};

export type RoomOffer = {
  id: number;
  listingId: number;
  listingTitle: string;
  applicantName: string;
  message: string;
  status: OfferStatus;
  direction: 'incoming' | 'outgoing';
};

const toRoomListing = (listing: ApiListing): RoomListing => listing;
const toRoomOffer = (offer: ApiOffer): RoomOffer => offer;

type RoomDataContextValue = {
  listings: RoomListing[];
  offers: RoomOffer[];
  user: UserAccount | null;
  loading: boolean;
  apiError: string | null;
  register: (input: RegisterInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addListing: (listing: Omit<RoomListing, 'id' | 'userId' | 'status' | 'created_at' | 'ownerName' | 'age' | 'occupation' | 'tags' | 'image'>) => Promise<void>;
  addOffer: (listing: RoomListing, message: string) => Promise<void>;
  setOfferStatus: (offerId: number, status: Exclude<OfferStatus, 'PENDING'>) => Promise<void>;
};

const RoomDataContext = createContext<RoomDataContextValue | null>(null);

export function RoomDataProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<RoomListing[]>([]);
  const [offers, setOffers] = useState<RoomOffer[]>([]);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const token = await getAccessToken();
        let authenticated = Boolean(token);
        if (authenticated) {
          try {
            const profile = await getCurrentUser();
            if (active) setUser(profile.user);
          } catch {
            await logoutRequest();
            authenticated = false;
          }
        }
        const listingResult = await getListings();
        if (active) setListings(listingResult.listings.map(toRoomListing));
        if (authenticated) {
          const offerResult = await getOffers();
          if (active) setOffers(offerResult.offers.map(toRoomOffer));
        }
        if (active) setApiError(null);
      } catch (error) {
        if (active) setApiError(error instanceof Error ? error.message : 'Sunucuya bağlanılamadı.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const refreshOffers = async () => {
    const result = await getOffers();
    setOffers(result.offers.map(toRoomOffer));
  };

  const register = async (input: RegisterInput) => {
    const account = await registerRequest(input);
    setUser(account);
    setApiError(null);
    await refreshOffers();
  };

  const login = async (email: string, password: string) => {
    const account = await loginRequest(email, password);
    setUser(account);
    setApiError(null);
    await refreshOffers();
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
    setOffers([]);
  };

  const value: RoomDataContextValue = {
    listings,
    offers,
    user,
    loading,
    apiError,
    register,
    login,
    logout,
    addListing: async (listing) => {
      const result = await createListingRequest(listing);
      setListings((current) => [toRoomListing(result.listing), ...current]);
    },
    addOffer: async (listing, message) => {
      const result = await createOfferRequest(listing.id, message);
      setOffers((current) => [{
        id: result.id, listingId: listing.id, listingTitle: listing.title, applicantName: 'Sen',
        message, status: result.status, direction: 'outgoing', created_at: new Date().toISOString(),
      }, ...current]);
    },
    setOfferStatus: async (offerId, status) => {
      await updateOfferStatusRequest(offerId, status);
      setOffers((current) => current.map((offer) => offer.id === offerId ? { ...offer, status } : offer));
    },
  };

  return <RoomDataContext.Provider value={value}>{children}</RoomDataContext.Provider>;
}

export function useRoomData() {
  const context = useContext(RoomDataContext);
  if (!context) throw new Error('useRoomData must be used inside RoomDataProvider');
  return context;
}