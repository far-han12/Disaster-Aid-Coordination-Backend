import express from 'express';
import { getMe } from '../controller/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/me', protect, getMe);

export default router;