import { Request,Response,NextFunction } from 'express';
import { seatService } from './seat.service.js';
export class SeatController {
  async getSeatsByEvent(req:Request,res:Response,next:NextFunction):Promise<void>{
    try{
      const seats=await seatService.getSeatsForEvent(String(req.params.eventId));
      // Never leak other users' identities on the public seat map.
      const own=req.authUser?.id;
      res.json({success:true,data:seats.map(s=>({...s,heldBy:s.heldBy===own?own:undefined,bookedBy:undefined}))});
    }catch(e){next(e);}
  }
  async holdSeats(req:Request,res:Response,next:NextFunction):Promise<void>{
    try{const {eventId,seatIds}=req.body||{};res.json(await seatService.holdSeats(eventId,seatIds,req.authUser!.id));}catch(e){next(e);}
  }
  async releaseSeats(req:Request,res:Response,next:NextFunction):Promise<void>{
    try{const {eventId,seatIds}=req.body||{};res.json({success:true,data:await seatService.releaseSeats(eventId,seatIds,req.authUser!.id)});}catch(e){next(e);}
  }
}
export const seatController=new SeatController();
