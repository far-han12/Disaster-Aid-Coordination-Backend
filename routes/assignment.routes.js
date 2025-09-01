import express from 'express';
import { assignVolunteerToRequest, getMyAssignments,markAssignmentAsComplete } from '../controller/assignment.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route for admins to create an assignment
router.post('/', protect, restrictTo('admin'), assignVolunteerToRequest);

// Route for volunteers to get their assignments
router.get('/my-assignments', protect, restrictTo('volunteer'), getMyAssignments);
router.put('/:id/complete', protect, restrictTo('volunteer'), markAssignmentAsComplete);
export default router;