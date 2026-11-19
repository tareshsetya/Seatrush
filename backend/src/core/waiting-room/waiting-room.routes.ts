import { Router, Request, Response } from 'express';
import { waitingRoomService } from './waiting-room.service.js';

const router = Router();

router.post('/join', (req: Request, res: Response) => {
  const { userId, eventId } = req.body;
  const status = waitingRoomService.join(userId || 'anon_user', eventId || 'event-coldplay-2026');
  res.json({ success: true, data: status });
});

router.get('/status/:userId', (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  const status = waitingRoomService.checkStatus(userId);
  res.json({ success: true, data: status });
});

router.post('/leave', (req: Request, res: Response) => {
  const { userId } = req.body;
  waitingRoomService.leave(userId);
  res.json({ success: true, message: 'Left waiting room' });
});

router.get('/stats', (req: Request, res: Response) => {
  res.json({ success: true, data: waitingRoomService.getStats() });
});

export default router;
