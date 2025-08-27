import express from 'express';
import { 
    getAllUsers, 
    deleteUser, 
    updateUserRole,
    getAidTypeSummary,
       updateRequestUrgency,
    findMatchingResources, deleteAidRequest, getAllResources,
    updateResourceByAdmin,
    deleteResourceByAdmin
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
router.get('/analytics/summary', getAidTypeSummary);
router.get('/requests/:id/matches', findMatchingResources);

// New route to update request urgency
router.patch('/requests/:id/urgency', updateRequestUrgency);

router.delete('/requests/:id', deleteAidRequest);
router.route('/resources')
    .get(getAllResources);

router.route('/resources/:id')
    .patch(updateResourceByAdmin)
    .delete(deleteResourceByAdmin);

export default router;
