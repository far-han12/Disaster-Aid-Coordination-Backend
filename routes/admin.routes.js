import express from 'express';
import { 
    getAllUsers, 
    deleteUser, 
    updateUserRole,
    getAidTypeSummary,
    findMatchingResources
} from '../controller/admin.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes in this file are protected and restricted to admins
router.use(protect, restrictTo('admin'));

// User management routes
router.route('/users')
    .get(getAllUsers);

router.route('/users/:id')
    .patch(updateUserRole)
    .delete(deleteUser);

// Analytics and Matching routes
router.get('/analytics/summary', getAidTypeSummary);
router.get('/requests/:id/matches', findMatchingResources);


export default router;
