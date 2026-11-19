import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { seedPostgres } from './database/seed-postgres.js';
import { postgresService } from './database/postgres.js';
import { redisService } from './core/redis/redis-client.js';
import { queueManager } from './core/queues/bullmq-queue.js';
import { SocketService } from './core/websocket/socket-service.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { seatService } from './modules/seats/seat.service.js';
import eventRoutes from './modules/events/event.routes.js';
import seatRoutes from './modules/seats/seat.routes.js';
import bookingRoutes from './modules/bookings/booking.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import paymentRoutes from './modules/payments/stripe.routes.js';
import waitingRoomRoutes from './core/waiting-room/waiting-room.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import discoveryRoutes from './modules/discovery/discovery.routes.js';
import { optionalAuth } from './modules/auth/auth.middleware.js';
import {checkJwtSetup} from './modules/auth/auth.crypto.js';
import {originGuard} from './middleware/origin-guard.js';

const app=express();
if(process.env.NODE_ENV==='production')app.set('trust proxy',1);
const server=http.createServer(app);
const origins=[...config.frontendUrl.split(',').map(s=>s.trim()),'http://localhost:5173','http://127.0.0.1:5173'];
SocketService.getInstance().init(server,config.frontendUrl);
app.use(cors({origin:origins,credentials:true}));
// Stripe signature validation must receive the ORIGINAL bytes, before JSON parsing.
app.use('/api/payments/webhook',express.raw({type:'application/json'}));
app.use(express.json({limit:'32kb'}));
app.use(requestLogger);
app.use(originGuard);
app.use(optionalAuth);
app.use('/api',rateLimiter);
app.get('/api/health',async(_req,res)=>{
  try{
    await postgresService.query('SELECT 1');
    res.json({status:'healthy',service:'SeatRush DEMO booking engine',
      demoCheckout:process.env.DEMO_CHECKOUT_ENABLED==='true',
      drivers:{postgres:'CONNECTED',redis:redisService.getConnected()?'CONNECTED':'OFFLINE_OPTIONAL',
        bullmq:queueManager.getIsBullMQActive()?'RUNNING':'DISABLED'},holdDurationSeconds:config.holdDurationSeconds});
  }catch{res.status(503).json({status:'unhealthy',postgres:'OFFLINE'});}
});
app.use('/api/auth',authRoutes);
app.use('/api/discover',discoveryRoutes);
app.use('/api/events',eventRoutes);
app.use('/api/seats',seatRoutes);
app.use('/api/bookings',bookingRoutes);
app.use('/api/admin',adminRoutes);
app.use('/api/payments',paymentRoutes);
// The old waiting-room queue is per-process and does not enforce admission.
if (process.env.NODE_ENV !== 'production') app.use('/api/waiting-room',waitingRoomRoutes);
app.use(errorHandler);

async function main(){
  checkJwtSetup();
  await postgresService.init(); // Fail CLOSED if PostgreSQL is missing.
  await seedPostgres();
  if(await redisService.init()) queueManager.init();
  // Sweeper works even when Redis/BullMQ is unavailable or a delayed job runs late.
  const sweep=setInterval(()=>seatService.releaseExpired().catch(console.error),15000);
  sweep.unref();
  server.listen(config.port,()=>console.log(`SeatRush API on http://localhost:${config.port} (PostgreSQL authoritative)`));
  const stop=async()=>{
    clearInterval(sweep);server.close();
    await queueManager.shutdown();await redisService.shutdown();await postgresService.shutdown();
    process.exit(0);
  };
  process.once('SIGTERM',stop);process.once('SIGINT',stop);
}
main().catch(error=>{console.error('STARTUP FAILED: SeatRush requires a working PostgreSQL database.',error);process.exit(1);});
