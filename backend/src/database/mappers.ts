import { Booking, Event, Seat } from '../types/index.js';
import { postgresService } from './postgres.js';

export const seatColumns = `id, event_id AS "eventId", seat_row AS "row", seat_col AS "col", label,
  tier, price, CASE WHEN status = 'HELD' AND held_until <= NOW()
  THEN 'AVAILABLE' ELSE status END AS status,
  CASE WHEN status = 'HELD' AND held_until > NOW() THEN held_by ELSE NULL END AS "heldBy",
  CASE WHEN status = 'HELD' AND held_until > NOW() THEN held_until ELSE NULL END AS "heldUntil",
  booked_by AS "bookedBy", booked_at AS "bookedAt", version`;
export function mapSeat(row: Record<string, any>): Seat {
  return {
    id: row.id, eventId: row.eventId, row: row.row, col: Number(row.col), label: row.label,
    tier: row.tier, price: Number(row.price), status: row.status,
    heldBy: row.heldBy ?? undefined,
    heldUntil: row.heldUntil ? new Date(row.heldUntil).toISOString() : undefined,
    bookedBy: row.bookedBy ?? undefined,
    bookedAt: row.bookedAt ? new Date(row.bookedAt).toISOString() : undefined,
    version: Number(row.version),
  };
}

export const eventColumns = `e.id, e.title, e.subtitle, e.artist, e.category, e.venue, e.location,
  to_char(e.event_date, 'YYYY-MM-DD') AS date, e.event_time AS time,
  e.banner_url AS "bannerUrl", e.description,
  COALESCE(count(s.id),0)::int AS "totalSeats",
  count(s.id) FILTER (WHERE s.status = 'AVAILABLE' OR (s.status = 'HELD' AND s.held_until <= NOW()))::int AS "availableSeats",
  count(s.id) FILTER (WHERE s.status = 'HELD' AND s.held_until > NOW())::int AS "heldSeats",
  count(s.id) FILTER (WHERE s.status = 'BOOKED')::int AS "bookedSeats",
  min(s.price) FILTER (WHERE s.tier = 'VIP') AS vip,
  min(s.price) FILTER (WHERE s.tier = 'PREMIUM') AS premium,
  min(s.price) FILTER (WHERE s.tier = 'STANDARD') AS standard`;
export const eventGroup = `GROUP BY e.id`;
export function mapEvent(row: Record<string, any>): Event {
  return { id: row.id, title: row.title, subtitle: row.subtitle ?? undefined,
    artist: row.artist, category: row.category, venue: row.venue, location: row.location,
    date: row.date, time: row.time, bannerUrl: row.bannerUrl, description: row.description,
    totalSeats: Number(row.totalSeats), availableSeats: Number(row.availableSeats),
    heldSeats: Number(row.heldSeats), bookedSeats: Number(row.bookedSeats),
    pricing: { VIP: Number(row.vip || 0), PREMIUM: Number(row.premium || 0), STANDARD: Number(row.standard || 0) } };
}
export async function loadBooking(where: string, value: string): Promise<Booking | undefined> {
  const result = await postgresService.query(`SELECT b.*, e.title AS "eventTitle",
    to_char(e.event_date,'YYYY-MM-DD') AS "eventDate", e.event_time AS "eventTime",
    e.venue FROM bookings b JOIN events e ON e.id=b.event_id WHERE b.${where}=$1`, [value]);
  if (!result.rows.length) return undefined;
  return hydrateBooking(result.rows[0]);
}
export async function hydrateBooking(row: any): Promise<Booking> {
  const seats = await postgresService.query(`SELECT ${seatColumns} FROM seats s
    JOIN booking_seats bs ON bs.seat_id=s.id WHERE bs.booking_id=$1 ORDER BY s.seat_row,s.seat_col`,[row.id]);
  return {
    id:row.id,referenceNumber:row.reference_number,eventId:row.event_id,eventTitle:row.eventTitle,
    eventDate:row.eventDate,eventTime:row.eventTime,venue:row.venue,userId:row.user_id,
    userEmail:row.user_email,userName:row.user_name,seats:seats.rows.map(mapSeat),
    totalAmount:Number(row.total_amount),createdAt:new Date(row.created_at).toISOString(),
    qrCodeData:row.qr_code_data,idempotencyKey:row.idempotency_key,status:row.status,
  };
}
