import express from 'express';
import { checkStatus, handleConsoleMessage, handleTestCommand } from '../../../controllers/statusController.js';

const statusRouter = express.Router();

// /api/status/
statusRouter.post('/', checkStatus);

// /api/status/console
statusRouter.post('/console', handleConsoleMessage);

// /api/status/test
statusRouter.post('/test', handleTestCommand);

export default statusRouter;