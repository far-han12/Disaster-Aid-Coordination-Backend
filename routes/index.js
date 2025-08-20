import express from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import aidRequestRouter from './aidrequest.routes.js';
import resourceRouter from './resource.routes.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/requests', aidRequestRouter);
router.use('/resources', resourceRouter);

export default router;