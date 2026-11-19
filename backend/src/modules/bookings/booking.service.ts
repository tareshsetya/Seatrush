import { createHash, randomUUID } from 'node:crypto';
import { postgresService } from '../../database/postgres.js';
import { seatColumns, mapSeat, loadBooking } from '../../database/mappers.js';
import { Booking, BookingRequest, Seat } from '../../types/index.js';
import { SocketService } from '../../core/websocket/socket-service.js';
import { AppError, ConcurrencyConflictError, HoldExpiredError, NotFoundError } from '../../core/errors/index.js';
import { queueManager } from '../../core/queues/bullmq-queue.js';

function validate(p: BookingRequest) {
  if (!p || typeof p !== 'object' || typeof p.eventId !== 'string' || !p.eventId || typeof p.userId !== 'string' || !p.userId ||
      typeof p.userEmail !== 'string' || !p.userEmail || typeof p.userName !== 'string' || !p.userName ||
      !p.idempotencyKey || typeof p.idempotencyKey !== 'string' || p.idempotencyKey.length > 128 ||
      !Array.isArray(p.seatIds) || p.seatIds.length < 1 || p.seatIds.length > 8 ||
      p.seatIds.some(s => typeof s !== 'string' || s.length > 64) || new Set(p.seatIds).size !== p.seatIds.length ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.userEmail) || p.userEmail.length > 255 ||
      p.userName.length > 255 || p.userId.length > 128 || p.eventId.length > 64) {
    throw new AppError('Invalid booking request or idempotency key',400,'INVALID_BOOKING');
  }
}
export class BookingService {
  async createBooking(payload: BookingRequest): Promise<{booking: Booking;isReplay:boolean}> {
    if (process.env.DEMO_CHECKOUT_ENABLED !== 'true') {
      throw new AppError('Checkout disabled. Configure verified Stripe payments before taking real payments.',503,'CHECKOUT_DISABLED');
    }
    validate(payload);
    const seatIds = [...payload.seatIds].sort();
    const fingerprint = createHash('sha256').update(JSON.stringify({eventId:payload.eventId,seatIds,
      userId:payload.userId,email:payload.userEmail,name:payload.userName})).digest('hex');
    // Single transaction includes idempotency guard, row locks, seats and booking record.
    const tx = await postgresService.withTransaction(async(client) => {
      // Serializes *same-key* retries, even with different seats and across API instances.
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))`,[payload.idempotencyKey]);
      const earlier = await client.query(`SELECT id,request_fingerprint FROM bookings WHERE idempotency_key=$1`,[payload.idempotencyKey]);
      if (earlier.rows.length) {
        if (earlier.rows[0].request_fingerprint !== fingerprint)
          throw new AppError('Idempotency key reused with different booking details',409,'IDEMPOTENCY_KEY_REUSED');
        return {id:earlier.rows[0].id,isReplay:true,changed:[] as Seat[]};
      }
      const event = await client.query(`SELECT title FROM events WHERE id=$1`,[payload.eventId]);
      if (!event.rows[0]) throw new NotFoundError('Event not found');
      const held:Seat[] = [];
      for (const id of seatIds) {
        // Explicit sorted locking prevents deadlocks for multi-seat transactions.
        const result = await client.query(`SELECT ${seatColumns} FROM seats WHERE id=$1 AND event_id=$2 FOR UPDATE`,[id,payload.eventId]);
        if (!result.rows[0]) throw new NotFoundError(`Seat '${id}' not found`);
        const seat=mapSeat(result.rows[0]);
        if (seat.status !== 'HELD' || seat.heldBy !== payload.userId)
          throw new ConcurrencyConflictError(`Seat ${seat.label} is no longer held by this session`);
        // SELECT above computes effective status with database clock. Expired holds fail.
        if (!seat.heldUntil) throw new HoldExpiredError(`Hold expired on ${seat.label}`);
        held.push(seat);
      }
      const subtotal = held.reduce((sum,s)=>sum+Number(s.price),0);
      const totalAmount = subtotal + Math.round(subtotal*0.08);
      const id=randomUUID();
      const referenceNumber=`SR-${randomUUID().slice(0,8).toUpperCase()}`;
      const qrCodeData=JSON.stringify({ref:referenceNumber,eventId:payload.eventId,seats:held.map(s=>s.label)});
      await client.query(`INSERT INTO bookings (id,reference_number,event_id,user_id,user_email,user_name,
        total_amount,idempotency_key,request_fingerprint,status,qr_code_data)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'CONFIRMED',$10)`,[
        id,referenceNumber,payload.eventId,payload.userId,payload.userEmail,payload.userName,
        totalAmount,payload.idempotencyKey,fingerprint,qrCodeData]);
      const changed:Seat[]=[];
      for(const seat of held){
        // Once row-locked, only this transaction can change this seat until COMMIT.
        const result=await client.query(`UPDATE seats SET status='BOOKED',held_by=NULL,held_until=NULL,
          booked_by=$1,booked_at=NOW(),version=version+1,updated_at=NOW()
          WHERE id=$2 AND status='HELD' AND held_by=$1 AND held_until>NOW()
          RETURNING ${seatColumns}`,[payload.userId,seat.id]);
        if(result.rowCount!==1) throw new HoldExpiredError(`Hold expired on ${seat.label} before confirmation`);
        changed.push(mapSeat(result.rows[0]));
        await client.query(`INSERT INTO booking_seats (booking_id,seat_id,price_at_booking)
          VALUES($1,$2,$3)`,[id,seat.id,seat.price]);
      }
      return{id,isReplay:false,changed};
    });
    const booking=await loadBooking('id',tx.id);
    if(!booking) throw new Error('Committed booking was not found');
    if (!tx.isReplay){
      SocketService.getInstance().broadcastSeatUpdate(payload.eventId,tx.changed,'BOOKED');
      queueManager.queueTicketEmail({bookingId:booking.id,userEmail:booking.userEmail,
        userName:booking.userName,referenceNumber:booking.referenceNumber}).catch(console.error);
    }
    return{booking,isReplay:tx.isReplay};
  }
  async getBookingById(id:string):Promise<Booking>{
    const b=await loadBooking('id',id); if(!b) throw new NotFoundError('Booking not found'); return b;
  }
  async getBookingByReference(ref:string):Promise<Booking>{
    const b=await loadBooking('reference_number',ref); if(!b) throw new NotFoundError('Booking not found'); return b;
  }
  async getBookingsByUser(userId:string):Promise<Booking[]>{
    const r=await postgresService.query(`SELECT id FROM bookings WHERE user_id=$1 ORDER BY created_at DESC`,[userId]);
    return Promise.all(r.rows.map(row=>this.getBookingById(row.id)));
  }
}
export const bookingService=new BookingService();
