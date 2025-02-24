import express from 'express';
import { sendCommand, toggleLaser, toggleSpindle, setSpindleSpeed, setSpindleZDepth } from '../../../controllers/movementController.js';

const controlRouter = express.Router();

// /api/control/
controlRouter.post('/', sendCommand);
controlRouter.post('/laser', toggleLaser);
controlRouter.post('/spindle', toggleSpindle);
controlRouter.post('/spindle/speed', setSpindleSpeed);
controlRouter.post('/spindle/depth', setSpindleZDepth);

export default controlRouter;