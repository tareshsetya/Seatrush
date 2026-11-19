import {Request,Response,NextFunction} from 'express';
import {redisService} from '../../core/redis/redis-client.js';
const local=new Map<string,{count:number;until:number}>();
// One limiter key per IP, per 15 minute window. Redis provides cross-instance coordination when available.
export async function authRateLimit(req:Request,res:Response,next:NextFunction):Promise<void>{
 const key='auth-limit:'+String(req.ip||req.socket.remoteAddress||'unknown').slice(0,100);
 const redis=redisService.getConnected()?redisService.getClient():null;
 try{
  if(redis){const count=await redis.incr(key);if(count===1)await redis.expire(key,900);
    if(count>18){res.status(429).json({success:false,message:'Too many sign-in attempts. Try again in a few minutes.'});return;}
  }else{const now=Date.now();const old=local.get(key);const info=old&&old.until>now?old:{count:0,until:now+900000};info.count++;local.set(key,info);
    if(info.count>18){res.status(429).json({success:false,message:'Too many attempts. Try again later.'});return;}
    if(local.size>10000)for(const [k,v] of local){if(v.until<=now)local.delete(k);}
  }
  next();
 }catch(error){console.error('Authentication rate limiter failed',error);res.status(503).json({success:false,message:'Authentication temporarily unavailable'});}
}
