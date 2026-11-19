import { Request, Response, NextFunction } from 'express';
import { seatService } from './seat.service.js';
export class SeatController {
  async getSeatsByEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ success:true, data: await seatService.getSeatsForEvent(String(req.params.eventId)) }); } catch(err){next(err);}
  }
  async holdSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId,seatIds,userId } = req.body || {};
      // Ignore client-selected TTL: normal bookings get the configured maximum.
      res.json(await seatService.holdSeats(eventId,seatIds,userId));
    } catch(err){next(err);}
  }
  async releaseSeats(req: Request,res:Response,next:NextFunction):Promise<void>{
    try { const {eventId,seatIds,userId}=req.body||{};
      res.json({success:true,data:await seatService.releaseSeats(eventId,seatIds,userId)});
    } catch(err){next(err);}
  }
}
export const seatController = new SeatController();
