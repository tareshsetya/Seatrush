import { Redis } from 'ioredis';
export class RedisService {
  private client:Redis|null=null;
  private connected=false;
  async init():Promise<boolean>{
    if(!process.env.REDIS_URL) {
      console.warn('REDIS_URL unset: BullMQ disabled (PostgreSQL still enforces holds).');
      return false;
    }
    const client=new Redis(process.env.REDIS_URL,{
      lazyConnect:true,maxRetriesPerRequest:1,connectTimeout:2500,
      retryStrategy:()=>null,
    });
    // Always attach an error listener so transient failures do not crash Node.
    client.on('error',error=>console.error('Redis:',error.message));
    try{await client.connect();this.client=client;this.connected=true;return true;}
    catch(error){console.warn('Redis offline; database remains authoritative.',error);client.disconnect();return false;}
  }
  getClient():Redis|null{return this.client;}
  getConnected():boolean{return this.connected && this.client?.status==='ready';}
  async shutdown():Promise<void>{if(this.client){this.client.disconnect();this.client=null;}this.connected=false;}
}
export const redisService=new RedisService();
