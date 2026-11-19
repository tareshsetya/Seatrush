import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { postgresService } from '../../database/postgres.js';
import { redisService } from '../../core/redis/redis-client.js';
import { queueManager } from '../../core/queues/bullmq-queue.js';
import { seatService } from '../seats/seat.service.js';
import { benchmarkService } from './benchmark.service.js';
import { seedPostgres } from '../../database/seed-postgres.js';
import { AppError, ConcurrencyConflictError } from '../../core/errors/index.js';

export class AdminController {
  async getMetrics(_req:Request,res:Response,next:NextFunction):Promise<void>{
    try{
      const [holds,bookings]=await Promise.all([
        postgresService.query(`SELECT count(*)::int AS n FROM seats WHERE status='HELD' AND held_until>NOW()`),
        postgresService.query(`SELECT count(*)::int AS n FROM bookings`),
      ]);
      res.json({success:true,data:{activeLocks:0,activeHolds:Number(holds.rows[0].n),
        totalBookings:Number(bookings.rows[0].n),lockCollisionsPrevented:0,idempotencyHits:0,
        expiredHoldsReleased:0,systemStatus:{postgresConnected:true,
          redisConnected:redisService.getConnected(),bullmqActive:queueManager.getIsBullMQActive(),
          stripeWebhooksProcessed:0}}});
    }catch(error){next(error);}
  }
  async runBenchmark(req:Request,res:Response,next:NextFunction):Promise<void>{
    try{res.json({success:true,data:await benchmarkService.runBenchmark(req.body?.targetSeats,req.body?.usersCount)});}catch(error){next(error);}
  }
  async fastForwardExpiry(_req:Request,res:Response,next:NextFunction):Promise<void>{
    try{const released=await seatService.releaseExpired();
      res.json({success:true,message:`Released ${released} already-expired holds`,released});}
    catch(error){next(error);}
  }
  async getAllBookings(_req:Request,res:Response,next:NextFunction):Promise<void>{
    try{const result=await postgresService.query('SELECT id FROM bookings ORDER BY created_at DESC LIMIT 100');
      res.json({success:true,data:result.rows.map(r=>r.id)});}catch(error){next(error);}
  }
  async resetDatabase(_req:Request,res:Response,next:NextFunction):Promise<void>{
    try{
      await postgresService.withTransaction(async client=>{
        await client.query('DELETE FROM booking_seats');
        await client.query('DELETE FROM bookings');
        await client.query("DELETE FROM seats");
        await client.query('DELETE FROM events');
      });
      await seedPostgres();
      res.json({success:true,message:'Local demo data reset. Never enable this in production.'});
    }catch(error){next(error);}
  }
  async simulateContention(req:Request,res:Response,next:NextFunction):Promise<void>{
    try{
      const eventId=req.body?.eventId || 'event-coldplay-2026';
      const seatIds=req.body?.seatIds || ['event-coldplay-2026-B7'];
      const users=Number(req.body?.users||10);
      if(!Number.isInteger(users)||users<1||users>100||!Array.isArray(seatIds)||seatIds.length!==1)
        throw new AppError('Choose one seat and 1–100 users',400,'INVALID_SIMULATION');
      const seat=(await seatService.getSeatsForEvent(eventId)).find(s=>s.id===seatIds[0]);
      if(!seat||seat.status!=='AVAILABLE') throw new ConcurrencyConflictError('Test seat is not available; choose another seat or reset local demo data.');
      const results=await Promise.all(Array.from({length:users},async(_,i)=>{
        const started=performance.now();
        try{await seatService.holdSeats(eventId,seatIds,`sim-${randomUUID()}`,60);
          return {user:`User ${i+1}`,status:'SUCCESS',message:'PostgreSQL transaction committed',latencyMs:Math.round(performance.now()-started)};}
        catch(error){return{user:`User ${i+1}`,status:'CONFLICT',message:(error as Error).message,latencyMs:Math.round(performance.now()-started)};}
      }));
      const won=results.filter(r=>r.status==='SUCCESS').length;
      res.json({success:true,summary:{totalAttempts:users,successfulHolds:won,
        conflictsPrevented:results.length-won,invariantPreserved:won===1},results});
    }catch(error){next(error);}
  }
}
export const adminController=new AdminController();
