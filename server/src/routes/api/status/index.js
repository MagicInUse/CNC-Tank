import express from 'express';
import { checkStatus, handleConsoleMessage, getCurrentPosition, setCurrentPosition } from '../../../controllers/statusController.js';

const statusRouter = express.Router();

// /api/status/
statusRouter.post('/', checkStatus);

// /api/status/console
statusRouter.post('/console', handleConsoleMessage);

// /api/status/position - Get or set the current position
statusRouter.get('/position', getCurrentPosition);
statusRouter.post('/position', setCurrentPosition);

export default statusRouter;