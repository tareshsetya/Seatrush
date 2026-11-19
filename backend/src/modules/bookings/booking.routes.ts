import { Router } from 'express';
import { bookingController } from './booking.controller.js';

const router = Router();
// This project still has a browser-local mock login, not verified identity.
// Protect booking history and personal data until real auth is implemented.
const devHistoryOnly = (_req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({success:false,message:'Booking history requires real authentication before public deployment.'});
    return;
  }
  next();
};

router.post('/', (req, res, next) => bookingController.create(req, res, next));
router.get('/user/:userId', devHistoryOnly, (req, res, next) => bookingController.getByUser(req, res, next));
router.get('/:id', devHistoryOnly, (req, res, next) => bookingController.getById(req, res, next));
router.get('/ref/:ref', devHistoryOnly, (req, res, next) => bookingController.getByReference(req, res, next));

export default router;
