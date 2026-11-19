export type SeatState = 'AVAILABLE' | 'HELD' | 'BOOKED';

export type SeatTier = 'VIP' | 'PREMIUM' | 'STANDARD';

export interface Seat {
  id: string;
  eventId: string;
  row: string;
  col: number;
  label: string; // e.g. "A-12"
  tier: SeatTier;
  price: number;
  status: SeatState;
  heldBy?: string; // userId / sessionId
  heldUntil?: string; // ISO string
  bookedBy?: string;
  bookedAt?: string;
  version: number; // For optimistic concurrency / row version tracking
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

export interface HoldSeatRequest {
  eventId: string;
  seatIds: string[];
  userId: string;
}

export interface HoldSeatResponse {
  success: boolean;
  heldSeats: Seat[];
  holdExpiresAt: string;
  ttlSeconds: number;
  message?: string;
}

export interface ReleaseSeatRequest {
  eventId: string;
  seatIds: string[];
  userId: string;
}

export interface BookingRequest {
  eventId: string;
  seatIds: string[];
  userId: string;
  userEmail: string;
  userName: string;
  idempotencyKey: string;
  paymentDetails: {
    cardNumberLast4: string;
    paymentMethod: string;
  };
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

export interface ConcurrencyMetrics {
  activeLocks: number;
  activeHolds: number;
  totalBookings: number;
  lockCollisionsPrevented: number;
  idempotencyHits: number;
  expiredHoldsReleased: number;
}

export type SocketEventType =
  | 'SEATS_UPDATED'
  | 'SEAT_HELD'
  | 'SEAT_RELEASED'
  | 'SEAT_BOOKED'
  | 'METRICS_UPDATED'
  | 'HELD_EXPIRING_WARNING';

export interface SocketSeatUpdatePayload {
  eventId: string;
  updatedSeats: Seat[];
  reason: 'HELD' | 'RELEASED' | 'BOOKED' | 'EXPIRED';
}
