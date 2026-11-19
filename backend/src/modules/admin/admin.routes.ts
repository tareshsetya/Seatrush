import { Router, Request, Response, NextFunction } from 'express';
import { adminController } from './admin.controller.js';
const router=Router();
const demoOnly=(_req:Request,res:Response,next:NextFunction)=>{
  if(process.env.NODE_ENV==='production'||process.env.ENABLE_DEMO_ADMIN_TOOLS!=='true'){
    res.status(403).json({success:false,message:'Unsafe demo admin operations are disabled on this server.'});return;
  }
  next();
};
router.get('/metrics',(req,res,next)=>adminController.getMetrics(req,res,next));
router.get('/bookings',demoOnly,(req,res,next)=>adminController.getAllBookings(req,res,next));
router.post('/reset',demoOnly,(req,res,next)=>adminController.resetDatabase(req,res,next));
router.post('/simulate',demoOnly,(req,res,next)=>adminController.simulateContention(req,res,next));
router.post('/benchmark',demoOnly,(req,res,next)=>adminController.runBenchmark(req,res,next));
router.post('/fast-forward',demoOnly,(req,res,next)=>adminController.fastForwardExpiry(req,res,next));
export default router;
