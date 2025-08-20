import express from 'express';
import { getResources, createResource } from '../controller/resource.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(getResources)
    .post(protect, restrictTo('donor'), createResource);

export default router;