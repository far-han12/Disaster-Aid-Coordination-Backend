import express from 'express';
import { getAidRequests, createAidRequest, getMyRequests } from '../controller/aidrequest.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// New route for requesters to get their own requests
router.get('/my-requests', protect, restrictTo('aidrequester'), getMyRequests);

router.route('/')
    .get(getAidRequests)
    .post(protect, restrictTo('aidrequester'), createAidRequest);

export default router;
