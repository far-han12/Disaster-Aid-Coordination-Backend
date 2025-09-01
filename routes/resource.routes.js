import express from 'express';
import { getResources, createResource,getMyResources,updateResource ,deleteResource} from '../controller/resource.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(getResources)
    .post(protect, restrictTo('donor'), createResource);
router.get('/my-resources', protect, restrictTo('donor'), getMyResources);
router.route('/:id')
    .patch(protect, restrictTo('donor'), updateResource)
    .delete(protect, restrictTo('donor'), deleteResource); 
export default router;