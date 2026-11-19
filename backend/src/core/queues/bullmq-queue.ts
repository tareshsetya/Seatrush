import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { redisService } from '../redis/redis-client.js';
import { seatService } from '../../modules/seats/seat.service.js';

interface ExpireJobPayload { eventId:string;seatId:string;userId:string;expiresAt:string }
interface EmailJobPayload { bookingId:string;userEmail:string;userName:string;referenceNumber:string }

export class QueueManager {
  private holdQueue:Queue<ExpireJobPayload>|null=null;
  private holdWorker:Worker<ExpireJobPayload>|null=null;
  private emailQueue:Queue<EmailJobPayload>|null=null;
  private emailWorker:Worker<EmailJobPayload>|null=null;
  private workerConnection:Redis|null=null;
  private active=false;

  init():void{
    const connection=redisService.getClient();
    if(!redisService.getConnected() || !connection){
      console.warn('Redis unavailable: PostgreSQL expiry sweeper will maintain correctness; BullMQ disabled.');
      return;
    }
    // BullMQ workers require unlimited retries on their own connection.
    this.workerConnection=new Redis(process.env.REDIS_URL || 'redis://localhost:6379',{
      maxRetriesPerRequest:null,
    });
    this.holdQueue=new Queue<ExpireJobPayload>('seatrush-hold-expiry',{connection});
    this.holdWorker=new Worker<ExpireJobPayload>('seatrush-hold-expiry',async(job:Job<ExpireJobPayload>)=>{
      const {eventId,seatId,userId,expiresAt}=job.data;
      await seatService.releaseExpired(eventId,seatId,userId,expiresAt);
    },{connection:this.workerConnection});
    this.emailQueue=new Queue<EmailJobPayload>('seatrush-email-tickets',{connection});
    this.emailWorker=new Worker<EmailJobPayload>('seatrush-email-tickets',async(job:Job<EmailJobPayload>)=>{
      // No provider connected. Do NOT claim an email was sent.
      console.log(`DEMO ticket notification processed for ${job.data.referenceNumber}; email delivery not configured.`);
    },{connection:this.workerConnection});
    for(const queue of [this.holdQueue,this.emailQueue]){
      queue.on('error',error=>console.error('BullMQ queue error:',error));
    }
    for(const worker of [this.holdWorker,this.emailWorker]){
      worker.on('error',error=>console.error('BullMQ worker error:',error));
    }
    this.active=true;
    console.log('BullMQ connected: delayed expiry and demo email notification jobs active.');
  }
  async scheduleHoldExpiry(eventId:string,seatId:string,userId:string,expiresAt:string):Promise<void>{
    if(!this.holdQueue) return;
    // Unique per hold generation: a stale delayed job can NEVER clear a renewed hold.
    const unique=Math.random().toString(36).slice(2);
    await this.holdQueue.add('expire-seat',{eventId,seatId,userId,expiresAt},{
      jobId:`expire-${seatId}-${unique}`,
      delay:Math.max(0,new Date(expiresAt).getTime()-Date.now()),
      removeOnComplete:1000,removeOnFail:1000,attempts:3,
    });
  }
  async queueTicketEmail(data:EmailJobPayload):Promise<void>{
    if(!this.emailQueue) return;
    await this.emailQueue.add('demo-notification',data,{jobId:`ticket-${data.bookingId}`,
      removeOnComplete:1000,attempts:3,backoff:{type:'exponential',delay:2000}});
  }
  getIsBullMQActive():boolean{return this.active;}
  async shutdown():Promise<void>{
    await this.holdWorker?.close();await this.emailWorker?.close();
    await this.holdQueue?.close();await this.emailQueue?.close();
    await this.workerConnection?.quit();this.active=false;
  }
}
export const queueManager=new QueueManager();
