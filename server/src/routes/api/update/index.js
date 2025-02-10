import express from 'express';
import { handleFirmwareUpdate, checkUpdateStatus } from '../../../controllers/updateController.js';
import fileUpload from 'express-fileupload';

const updateRouter = express.Router();

// GET /api/update - Check update status
updateRouter.get('/', checkUpdateStatus);

// POST /api/update - Handle firmware update
updateRouter.post('/', handleFirmwareUpdate);

export default updateRouter;