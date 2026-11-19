import { Booking, ConcurrencyMetrics, Event, HoldSeatResponse, Seat } from '../types';

// Set VITE_API_URL=https://your-api-host.example.com before a Vercel build.
const API_BASE = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api`;

// Generates or retrieves stable user session ID
export function getOrCreateUserId(): string {
  let uid = localStorage.getItem('seatrush_user_id');
  if (!uid) {
    uid = 'usr_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('seatrush_user_id', uid);
  }
  return uid;
}

export const api = {
  async getEvents(): Promise<Event[]> {
    const res = await fetch(`${API_BASE}/events`);
    const json = await res.json();
    return json.data;
  },

  async getEvent(id: string): Promise<Event> {
    const res = await fetch(`${API_BASE}/events/${id}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch event');
    return json.data;
  },

  async getSeats(eventId: string): Promise<Seat[]> {
    const res = await fetch(`${API_BASE}/seats/${eventId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch seats');
    return json.data;
  },

  async holdSeats(
    eventId: string,
    seatIds: string[],
    userId: string,
    ttlSeconds?: number,
  ): Promise<HoldSeatResponse> {
    const res = await fetch(`${API_BASE}/seats/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, seatIds, userId, ttlSeconds }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to hold seats');
    return json;
  },

  async releaseSeats(eventId: string, seatIds: string[], userId: string): Promise<Seat[]> {
    const res = await fetch(`${API_BASE}/seats/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, seatIds, userId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to release seats');
    return json.data;
  },

  async createBooking(payload: {
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
  }): Promise<{ booking: Booking; isReplay: boolean }> {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': payload.idempotencyKey,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Booking failed');
    return { booking: json.data, isReplay: json.isReplay || false };
  },

  async getBooking(id: string): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings/${id}`);
    const json = await res.json();
    return json.data;
  },

  async getUserBookings(userId: string): Promise<Booking[]> {
    const res = await fetch(`${API_BASE}/bookings/user/${userId}`);
    const json = await res.json();
    return json.data || [];
  },

  async getAdminMetrics(): Promise<ConcurrencyMetrics> {
    const res = await fetch(`${API_BASE}/admin/metrics`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch admin metrics');
    return json.data;
  },

  async runBenchmark(targetSeats: string[], usersCount: number) {
    const res = await fetch(`${API_BASE}/admin/benchmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetSeats, usersCount }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Request failed');
    return json.data;
  },

  async fastForwardExpiry() {
    const res = await fetch(`${API_BASE}/admin/fast-forward`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Request failed');
    return json;
  },

  async simulateWebhook(webhookEvent: any) {
    const res = await fetch(`${API_BASE}/payments/simulate-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookEvent }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Request failed');
    return json;
  },

  async simulateContention(eventId: string, seatIds: string[], users: number) {
    const res = await fetch(`${API_BASE}/admin/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, seatIds, users }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Request failed');
    return json;
  },

  async resetDatabase() {
    const res = await fetch(`${API_BASE}/admin/reset`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Request failed');
    return json;
  },
};
