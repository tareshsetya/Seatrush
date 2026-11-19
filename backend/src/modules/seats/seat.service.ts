import { postgresService } from '../../database/postgres.js';
import { mapSeat, seatColumns } from '../../database/mappers.js';
import { Seat, HoldSeatResponse } from '../../types/index.js';
import { SocketService } from '../../core/websocket/socket-service.js';
import { ConcurrencyConflictError, NotFoundError, AppError } from '../../core/errors/index.js';
import { config } from '../../config/index.js';
import { queueManager } from '../../core/queues/bullmq-queue.js';
import pg from 'pg';

const allowedIds = (ids: string[]): string[] => {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 8 ||
      ids.some((id) => typeof id !== 'string' || id.length > 64) ||
      new Set(ids).size !== ids.length) {
    throw new AppError('Choose 1 to 8 distinct valid seats', 400, 'INVALID_SEATS');
  }
  return [...ids].sort(); // deterministic lock order across all backend instances
};
const validText = (value: string, key: string): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > 128) {
    throw new AppError(`Invalid ${key}`, 400, 'INVALID_INPUT');
  }
  return value.trim();
};

async function lockSeats(client: pg.PoolClient, eventId: string, seatIds: string[]): Promise<Seat[]> {
  const seats: Seat[] = [];
  for (const id of seatIds) {
    const result = await client.query(`SELECT ${seatColumns} FROM seats WHERE id=$1 AND event_id=$2 FOR UPDATE`, [id,eventId]);
    if (!result.rows[0]) throw new NotFoundError(`Seat '${id}' not found for event`);
    seats.push(mapSeat(result.rows[0]));
  }
  return seats;
}

export class SeatService {
  async getSeatsForEvent(eventId: string): Promise<Seat[]> {
    const result = await postgresService.query(`SELECT ${seatColumns} FROM seats
      WHERE event_id=$1 ORDER BY seat_row,seat_col`, [eventId]);
    return result.rows.map(mapSeat);
  }
  async holdSeats(eventId: string, seatIds: string[], userId: string, requestedTtl?: number): Promise<HoldSeatResponse> {
    validText(eventId,'eventId'); validText(userId,'userId');
    const keys = allowedIds(seatIds);
    // Only configurable short TTLs in local TESTS; public API must not override the policy.
    const ttlSeconds = Math.min(config.holdDurationSeconds, Math.max(1, Number(requestedTtl || config.holdDurationSeconds)));
    const result = await postgresService.withTransaction(async (client) => {
      const seats = await lockSeats(client,eventId,keys);
      for (const seat of seats) {
        if (seat.status === 'BOOKED') throw new ConcurrencyConflictError(`Seat ${seat.label} is already booked`);
        if (seat.status === 'HELD' && seat.heldBy !== userId)
          throw new ConcurrencyConflictError(`Seat ${seat.label} is held by another shopper`);
      }
      const held: Seat[] = [];
      // Database clock is authoritative: no cross-server clock drift.
      for (const seat of seats) {
        const updated = await client.query(`UPDATE seats SET status='HELD',held_by=$1,
          held_until=NOW()+($2::int * INTERVAL '1 second'),booked_by=NULL,booked_at=NULL,
          version=version+1,updated_at=NOW() WHERE id=$3 RETURNING ${seatColumns}`, [userId, ttlSeconds, seat.id]);
        held.push(mapSeat(updated.rows[0]));
      }
      return held;
    });
    SocketService.getInstance().broadcastSeatUpdate(eventId,result,'HELD');
    for (const seat of result) {
      // Delayed cleanup is an optimization; expiration is always enforced in SQL.
      queueManager.scheduleHoldExpiry(eventId,seat.id,userId,seat.heldUntil!).catch(console.error);
    }
    return { success:true, heldSeats:result, holdExpiresAt:result[0].heldUntil!, ttlSeconds,
      message:`Held ${result.length} seat(s) for up to ${ttlSeconds} seconds.` };
  }
  async releaseSeats(eventId: string, seatIds: string[], userId: string): Promise<Seat[]> {
    validText(eventId,'eventId'); validText(userId,'userId');
    const keys = allowedIds(seatIds);
    const released = await postgresService.withTransaction(async (client) => {
      const result: Seat[] = [];
      const seats = await lockSeats(client,eventId,keys);
      for (const seat of seats) {
        // Never let a client use an 'admin' impersonation to release others' holds.
        if (seat.status !== 'HELD' || seat.heldBy !== userId) continue;
        const updated = await client.query(`UPDATE seats SET status='AVAILABLE',held_by=NULL,
          held_until=NULL,version=version+1,updated_at=NOW() WHERE id=$1 RETURNING ${seatColumns}`, [seat.id]);
        result.push(mapSeat(updated.rows[0]));
      }
      return result;
    });
    if (released.length) SocketService.getInstance().broadcastSeatUpdate(eventId,released,'RELEASED');
    return released;
  }
  /** Safe to call many times and from stale queue jobs; SQL checks expiry and ownership. */
  async releaseExpired(eventId?: string, seatId?: string, userId?: string, deadline?: string): Promise<number> {
    const params: unknown[] = [];
    let filters = `status='HELD' AND held_until<=NOW()`;
    if (eventId) { params.push(eventId); filters += ` AND event_id=$${params.length}`; }
    if (seatId) { params.push(seatId); filters += ` AND id=$${params.length}`; }
    if (userId) { params.push(userId); filters += ` AND held_by=$${params.length}`; }
    if (deadline) { params.push(deadline); filters += ` AND held_until=$${params.length}::timestamptz`; }
    const changed = await postgresService.query(`UPDATE seats SET status='AVAILABLE',held_by=NULL,held_until=NULL,
      version=version+1,updated_at=NOW() WHERE ${filters} RETURNING ${seatColumns}`,params);
    const byEvent = new Map<string,Seat[]>();
    for (const row of changed.rows) {
      const seat = mapSeat(row);
      const entries = byEvent.get(seat.eventId) || [];
      entries.push(seat); byEvent.set(seat.eventId,entries);
    }
    for (const [event, seats] of byEvent) SocketService.getInstance().broadcastSeatUpdate(event,seats,'EXPIRED');
    return changed.rowCount || 0;
  }
}
export const seatService = new SeatService();
