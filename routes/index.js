import express from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import aidRequestRouter from './aidrequest.routes.js';
import resourceRouter from './resource.routes.js'; // Ensure this is imported
import adminRouter from './admin.routes.js';
import assignmentRouter from './assignment.routes.js';
import matchRouter from './match.routes.js'; // 1. Import the new router

const router = express.Router();
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/requests', aidRequestRouter);
router.use('/resources', resourceRouter); // Ensure this is used
router.use('/admin', adminRouter);
router.use('/assignments', assignmentRouter);
router.use('/matches', matchRouter); 
export default router;