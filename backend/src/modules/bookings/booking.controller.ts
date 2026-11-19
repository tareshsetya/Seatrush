import { Request, Response, NextFunction } from 'express';
import { bookingService } from './booking.service.js';
export class BookingController {
  async create(req:Request,res:Response,next:NextFunction):Promise<void>{
    try {
      const key=req.headers['idempotency-key'] || req.body?.idempotencyKey;
      const {booking,isReplay}=await bookingService.createBooking({...req.body,idempotencyKey:key});
      if(isReplay) res.setHeader('X-Idempotent-Replay','true');
      res.status(isReplay?200:201).json({success:true,isReplay,data:booking});
    }catch(err){next(err);}
  }
  async getById(req:Request,res:Response,next:NextFunction):Promise<void>{
    try{res.json({success:true,data:await bookingService.getBookingById(String(req.params.id))});}catch(err){next(err);}
  }
  async getByReference(req:Request,res:Response,next:NextFunction):Promise<void>{
    try{res.json({success:true,data:await bookingService.getBookingByReference(String(req.params.ref))});}catch(err){next(err);}
  }
  async getByUser(req:Request,res:Response,next:NextFunction):Promise<void>{
    try{res.json({success:true,data:await bookingService.getBookingsByUser(String(req.params.userId))});}catch(err){next(err);}
  }
}
export const bookingController=new BookingController();
