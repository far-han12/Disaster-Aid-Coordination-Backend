import express from 'express';
import { getMe, createMyContactInfo, getMyContactInfo } from '../controller/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply the 'protect' middleware to each route individually.
// This guarantees that the user is authenticated before any of these functions run.
router.get('/me', protect, getMe);
router.post('/me/contact-info', protect, createMyContactInfo);
router.get('/me/contact-info', protect, getMyContactInfo);

export default router;