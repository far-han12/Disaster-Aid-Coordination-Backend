import express from 'express';
import { 
    getAidRequests, 
    createAidRequest, 
    getMyRequests,
    updateAidRequest,
    deleteAidRequest
} from '../controller/aidrequest.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// This route is public for donors and admins to see
router.get('/', getAidRequests);


// 
// The role has been corrected from 'aidrequester' to 'aidrequester'
router.post('/', protect, restrictTo('aidrequester'), createAidRequest);

router.get('/my-requests', protect, restrictTo('aidrequester'), getMyRequests);

router.route('/:id')
    .patch(protect, restrictTo('aidrequester'), updateAidRequest)
    .delete(protect, protect,  restrictTo('aidrequester'), deleteAidRequest);

export default router;