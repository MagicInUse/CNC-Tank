import express from 'express';
import fileUpload from 'express-fileupload';
import apiRouter from './api/index.js';
import { handleFirmwareUpdate } from '../controllers/updateController.js';

const router = express.Router();

router.use('/api', apiRouter);

export default router;