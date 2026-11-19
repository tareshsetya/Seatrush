import { Request, Response, NextFunction } from 'express';
import { bookingService } from './booking.service.js';
import { AppError } from '../../core/errors/index.js';
export class BookingController {
  async create(req:Request,res:Response,next:NextFunction):Promise<void>{
    try{
      const key=req.headers['idempotency-key'];
      const u=req.authUser!;
      const {booking,isReplay}=await bookingService.createBooking({
        eventId:req.body?.eventId,seatIds:req.body?.seatIds,idempotencyKey:key,
        userId:u.id,userName:u.name,userEmail:u.email,
        paymentDetails:{cardNumberLast4:'',paymentMethod:'demo'},
      });
      if(isReplay)res.setHeader('X-Idempotent-Replay','true');
      res.status(isReplay?200:201).json({success:true,isReplay,data:booking});
    }catch(e){next(e);}
  }
  private async respond(req:Request,res:Response,promise:Promise<import('../../types/index.js').Booking>):Promise<void>{
    const booking=await promise;
    if(booking.userId!==req.authUser!.id && req.authUser!.role!=='ADMIN')throw new AppError('Not your booking',403,'FORBIDDEN');
    res.json({success:true,data:booking});
  }
  async getById(req:Request,res:Response,next:NextFunction):Promise<void>{
    try{await this.respond(req,res,bookingService.getBookingById(String(req.params.id)));}catch(e){next(e);}
  }
  async getByReference(req:Request,res:Response,next:NextFunction):Promise<void>{
    try{await this.respond(req,res,bookingService.getBookingByReference(String(req.params.ref)));}catch(e){next(e);}
  }
  async getByUser(req:Request,res:Response,next:NextFunction):Promise<void>{
    try{
      if(req.params.userId && req.params.userId!==req.authUser!.id && req.authUser!.role!=='ADMIN')throw new AppError('Not your bookings',403,'FORBIDDEN');
      const id=req.params.userId||req.authUser!.id;
      res.json({success:true,data:await bookingService.getBookingsByUser(id)});
    }catch(e){next(e);}
  }
}
export const bookingController=new BookingController();
