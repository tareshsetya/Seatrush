import { randomUUID } from 'node:crypto';
import { seatService } from '../seats/seat.service.js';
import { postgresService } from '../../database/postgres.js';
import { ConcurrencyConflictError, AppError } from '../../core/errors/index.js';

export interface BenchmarkReport {
  timestamp:string;concurrencyLevel:number;totalRequests:number;durationMs:number;
  requestsPerSecond:number;successfulHolds:number;conflictsPrevented:number;
  latencies:{min:number;max:number;avg:number;p50:number;p95:number;p99:number};
  invariantVerified:boolean;doubleBookingsCount:number;
}
export class BenchmarkService {
  async runBenchmark(targetSeats:string[],usersCount:number):Promise<BenchmarkReport>{
    const eventId='event-coldplay-2026';
    if(!Array.isArray(targetSeats)||targetSeats.length<1||targetSeats.length>8||
       targetSeats.some(s=>typeof s!=='string'||s.length>64)||
       !Number.isInteger(usersCount)||usersCount<1||usersCount>100)
      throw new AppError('Benchmark requires 1-8 target seats and 1-100 users',400,'INVALID_BENCHMARK');
    // Never reset an existing booking or somebody else's active hold.
    const before=await seatService.getSeatsForEvent(eventId);
    if(targetSeats.some(id=>before.find(s=>s.id===id)?.status!=='AVAILABLE'))
      throw new ConcurrencyConflictError('Choose currently AVAILABLE seats, or run the local demo reset first.');
    const durations:number[]=[];
    let won=0;let lost=0;
    const started=performance.now();
    await Promise.all(Array.from({length:usersCount},async(_,index)=>{
      const seat=targetSeats[index%targetSeats.length];
      const now=performance.now();
      try {await seatService.holdSeats(eventId,[seat],`bench-${randomUUID()}`,60);won++;}
      catch(error){if(error instanceof ConcurrencyConflictError)lost++;else throw error;}
      finally{durations.push(performance.now()-now);}
    }));
    const elapsed=performance.now()-started;
    durations.sort((a,b)=>a-b);
    const p=(q:number)=>Math.round(durations[Math.min(durations.length-1,Math.floor(q*(durations.length-1)))]||0);
    const row=await postgresService.query(`SELECT count(*)::int AS count FROM seats
      WHERE event_id=$1 AND id=ANY($2::text[]) AND status='HELD' AND held_until>NOW()`,[eventId,targetSeats]);
    const uniqueWinners=Number(row.rows[0].count);
    return {
      timestamp:new Date().toISOString(),concurrencyLevel:usersCount,totalRequests:usersCount,
      durationMs:Math.round(elapsed),requestsPerSecond:Math.round(usersCount/Math.max(elapsed/1000,0.001)*10)/10,
      successfulHolds:won,conflictsPrevented:lost,
      latencies:{min:p(0),max:p(1),avg:Math.round(durations.reduce((a,b)=>a+b,0)/durations.length),p50:p(.5),p95:p(.95),p99:p(.99)},
      invariantVerified:uniqueWinners===won && won===Math.min(usersCount,targetSeats.length),
      doubleBookingsCount:Math.max(0,won-uniqueWinners),
    };
  }
}
export const benchmarkService=new BenchmarkService();
