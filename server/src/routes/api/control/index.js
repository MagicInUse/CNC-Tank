import express from 'express';
import { sendCommand, toggleLaser, toggleSpindle, setSpindleSpeed, setSpindleZDepth, homeZAxis } from '../../../controllers/movementController.js';

const controlRouter = express.Router();

// /api/control/
controlRouter.post('/', sendCommand); // Send command to the machine - generic
controlRouter.post('/laser', toggleLaser);
controlRouter.post('/spindle', toggleSpindle);
controlRouter.post('/spindle/speed', setSpindleSpeed);
controlRouter.post('/spindle/depth', setSpindleZDepth);
controlRouter.post('/zhome', homeZAxis); // New endpoint for Z-axis homing

export default controlRouter;