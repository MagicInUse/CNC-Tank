import express from 'express';
import { checkStatus, handleConsoleMessage } from '../../../controllers/statusController.js';

const statusRouter = express.Router();

// /api/status/
statusRouter.post('/', checkStatus);

// /api/status/console
statusRouter.post('/console', handleConsoleMessage);

export default statusRouter;