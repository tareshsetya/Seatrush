import { Router } from 'express';
import { eventController } from './event.controller.js';

const router = Router();

router.get('/', (req, res, next) => eventController.getAll(req, res, next));
router.get('/:id', (req, res, next) => eventController.getById(req, res, next));

export default router;
