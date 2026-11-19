import { postgresService } from './postgres.js';
import { db } from './in-memory-db.js';
import { seedDatabase } from './seed.js';

/** Idempotent demo seed, never overwrites genuine bookings or seat assignments. */
export async function seedPostgres(): Promise<void> {
  db.reset();
  seedDatabase();
  const events = db.getAllEvents();
  await postgresService.withTransaction(async (client) => {
    for (const event of events) {
      await client.query(`INSERT INTO events
        (id,title,subtitle,artist,category,venue,location,event_date,event_time,banner_url,description,total_seats)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`, [
        event.id,event.title,event.subtitle || null,event.artist,event.category,event.venue,event.location,
        event.date,event.time,event.bannerUrl,event.description,event.totalSeats,
      ]);
      for (const seat of db.getSeatsByEvent(event.id)) {
        await client.query(`INSERT INTO seats
          (id,event_id,seat_row,seat_col,label,tier,price,status,booked_by,booked_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`, [
          seat.id,seat.eventId,seat.row,seat.col,seat.label,seat.tier,seat.price,
          seat.status,seat.bookedBy ?? null,seat.bookedAt ?? null,
        ]);
      }
    }
  });
  db.reset(); // The demo generator is NOT consulted to serve API traffic.
  console.log(`Seeded/verified ${events.length} demo events (existing data preserved).`);
}
