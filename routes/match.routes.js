import express from 'express';
import { findNewMatches, getPendingMatches, confirmMatchAndAssign } from '../controller/match.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.post('/find', findNewMatches);
router.get('/pending', getPendingMatches);
router.post('/:id/confirm', confirmMatchAndAssign);

export default router;