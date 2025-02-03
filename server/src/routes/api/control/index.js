import express from 'express';
import { sendCommand } from '../../../controllers/movementController.js';

const controlRouter = express.Router();

// /api/control/
controlRouter.post('/', sendCommand);

export default controlRouter;