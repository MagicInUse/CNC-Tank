import express from 'express';
import fileUpload from 'express-fileupload';
import apiRouter from './api/index.js';
import { handleFirmwareUpdate } from '../controllers/updateController.js';

const router = express.Router();

router.use('/api', apiRouter);

// File upload middleware
router.use(fileUpload());

// Update routes
router.get('/update', (req, res) => {
    res.send('Update endpoint');
});
router.post('/update', handleFirmwareUpdate);

export default router;