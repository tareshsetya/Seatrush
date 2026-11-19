import { Request, Response, NextFunction } from 'express';
import { eventService } from './event.service.js';
export class EventController {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ success: true, data: await eventService.getAllEvents() }); } catch (err) { next(err); }
  }
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ success: true, data: await eventService.getEventById(String(req.params.id)) }); } catch (err) { next(err); }
  }
}
export const eventController = new EventController();
