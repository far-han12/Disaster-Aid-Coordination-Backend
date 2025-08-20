import express from 'express';
import { assignVolunteerToRequest } from '../controller/assignment.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes here are protected and restricted to admins
router.use(protect, restrictTo('admin'));

router.route('/')
    .post(assignVolunteerToRequest);

export default router;
