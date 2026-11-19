import { Router } from 'express';
import { seatController } from './seat.controller.js';

const router = Router();

router.get('/:eventId', (req, res, next) => seatController.getSeatsByEvent(req, res, next));
router.post('/hold', (req, res, next) => seatController.holdSeats(req, res, next));
router.post('/release', (req, res, next) => seatController.releaseSeats(req, res, next));

export default router;
