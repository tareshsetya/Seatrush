import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { postgresService } from '../src/database/postgres.js';
import { seedPostgres } from '../src/database/seed-postgres.js';
import { seatService } from '../src/modules/seats/seat.service.js';
import { bookingService } from '../src/modules/bookings/booking.service.js';
import { SeatStateMachine } from '../src/core/state-machine/seat-state-machine.js';

const eventId='event-coldplay-2026';
const target=['A1','A2','A3','A4','A7'].map(s=>`${eventId}-${s}`);
const user='integration-test-buyer';
async function clean() {
  await postgresService.withTransaction(async client=>{
    await client.query(`DELETE FROM booking_seats WHERE seat_id = ANY($1::text[])`,[target]);
    await client.query(`DELETE FROM bookings WHERE user_id LIKE 'integration-test-%'`);
    await client.query(`UPDATE seats SET status='AVAILABLE',held_by=NULL,held_until=NULL,
      booked_by=NULL,booked_at=NULL,version=version+1 WHERE id=ANY($1::text[])`,[target]);
  });
}

describe('Real PostgreSQL SeatRush integration: no in-memory fallback',()=>{
  before(async()=>{await postgresService.init();await seedPostgres();});
  beforeEach(clean);
  after(async()=>{await clean();await postgresService.shutdown();});

  it('state machine explicitly rejects invalid transitions',()=>{
    assert.equal(SeatStateMachine.canTransition('AVAILABLE','HELD'),true);
    assert.equal(SeatStateMachine.canTransition('AVAILABLE','BOOKED'),false);
  });
  it('25 concurrent hold requests: exactly one commits, the others fail',async()=>{
    const attempts=await Promise.all(Array.from({length:25},(_,n)=>
      seatService.holdSeats(eventId,[target[0]],`integration-test-${n}`,60)
        .then(()=>true).catch(()=>false)));
    assert.equal(attempts.filter(Boolean).length,1);
    const seat=(await seatService.getSeatsForEvent(eventId)).find(s=>s.id===target[0]);
    assert.equal(seat?.status,'HELD');
  });
  it('multi-seat holds are all-or-nothing when a seat is booked',async()=>{
    // Presale seat A5 is prebooked by demo fixture.
    await assert.rejects(seatService.holdSeats(eventId,[target[0],`${eventId}-A5`],user));
    assert.equal((await seatService.getSeatsForEvent(eventId)).find(s=>s.id===target[0])?.status,'AVAILABLE');
  });
  it('same idempotency key concurrently returns the identical committed booking',async()=>{
    await seatService.holdSeats(eventId,[target[1]],user);
    const payload={eventId,seatIds:[target[1]],userId:user,userEmail:'demo@example.com',
      userName:'Integration Tester',idempotencyKey:`integration-test-${Date.now()}`,
      paymentDetails:{cardNumberLast4:'4242',paymentMethod:'demo'}};
    const [a,b]=await Promise.all([bookingService.createBooking(payload),bookingService.createBooking(payload)]);
    assert.equal(a.booking.id,b.booking.id);
    assert.equal(Number(a.isReplay)+Number(b.isReplay),1);
    assert.equal(a.booking.totalAmount,Math.round(350*1.08));
    assert.equal((await seatService.getSeatsForEvent(eventId)).find(s=>s.id===target[1])?.status,'BOOKED');
    const count=await postgresService.query(`SELECT count(*)::int AS n FROM bookings WHERE idempotency_key=$1`,[payload.idempotencyKey]);
    assert.equal(count.rows[0].n,1);
    await assert.rejects(bookingService.createBooking({...payload,userEmail:'different@example.com'}),
      /Idempotency key reused/);
  });
  it('expired holds are claimable even without a BullMQ worker',async()=>{
    await seatService.holdSeats(eventId,[target[2]],'integration-test-older',1);
    await new Promise(resolve=>setTimeout(resolve,1200));
    await seatService.holdSeats(eventId,[target[2]],'integration-test-newer',60);
    await seatService.releaseExpired(eventId,target[2],'integration-test-older');
    const seat=(await seatService.getSeatsForEvent(eventId)).find(s=>s.id===target[2]);
    assert.equal(seat?.heldBy,'integration-test-newer');
  });
});
