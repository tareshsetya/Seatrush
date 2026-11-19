import { Router } from 'express';
import { seatController } from './seat.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
const router=Router();
router.get('/:eventId',(req,res,next)=>seatController.getSeatsByEvent(req,res,next));
router.post('/hold',requireAuth,(req,res,next)=>seatController.holdSeats(req,res,next));
router.post('/release',requireAuth,(req,res,next)=>seatController.releaseSeats(req,res,next));
export default router;
