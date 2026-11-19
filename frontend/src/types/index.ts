export type SeatState = 'AVAILABLE' | 'HELD' | 'BOOKED';

export type SeatTier = 'VIP' | 'PREMIUM' | 'STANDARD';

export interface Seat {
  id: string;
  eventId: string;
  row: string;
  col: number;
  label: string;
  tier: SeatTier;
  price: number;
  status: SeatState;
  heldBy?: string;
  heldUntil?: string;
  bookedBy?: string;
  bookedAt?: string;
  version: number;
}

export interface Event {
  id: string;
  title: string;
  subtitle?: string;
  artist: string;
  category: 'Concert' | 'Sports' | 'Movies' | 'Comedy' | 'Theater' | 'Festival';
  venue: string;
  location: string;
  date: string;
  time: string;
  bannerUrl: string;
  description: string;
  totalSeats: number;
  availableSeats: number;
  heldSeats: number;
  bookedSeats: number;
  pricing: {
    VIP: number;
    PREMIUM: number;
    STANDARD: number;
  };
}

export interface HoldSeatResponse {
  success: boolean;
  heldSeats: Seat[];
  holdExpiresAt: string;
  ttlSeconds: number;
  message?: string;
}

export interface Booking {
  id: string;
  referenceNumber: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  userId: string;
  userEmail: string;
  userName: string;
  seats: Seat[];
  totalAmount: number;
  createdAt: string;
  qrCodeData: string;
  idempotencyKey: string;
  status: 'CONFIRMED' | 'REFUNDED' | 'FAILED';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  joinedDate: string;
}

export interface ConcurrencyMetrics {
  activeLocks: number;
  activeHolds: number;
  totalBookings: number;
  lockCollisionsPrevented: number;
  idempotencyHits: number;
  expiredHoldsReleased: number;
}

export interface SocketSeatUpdatePayload {
  eventId: string;
  updatedSeats: Seat[];
  reason: 'HELD' | 'RELEASED' | 'BOOKED' | 'EXPIRED';
}

export interface DiscoveryItem {id:string;source:'ticketmaster'|'tmdb';kind:'event'|'movie';title:string;subtitle:string;image:string;date:string;venue:string;city:string;url:string;category:string;}
export interface DiscoveryMeta {city:string;providers:{ticketmaster:boolean;tmdb:boolean};warnings:string[];notice:string;}
