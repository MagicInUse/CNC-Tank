import express from 'express';
import { sendCommand, toggleLaser, toggleSpindle, setSpindleSpeed, setSpindleZDepth, homeZAxis } from '../../../controllers/movementController.js';
import { convertGcode, executeGcode, getGcodeStatus, stopGcode } from '../../../controllers/gcodeController.js';

const controlRouter = express.Router();

// /api/control/
controlRouter.post('/', sendCommand);
controlRouter.post('/laser', toggleLaser); 
controlRouter.post('/spindle', toggleSpindle);
controlRouter.post('/spindle/speed', setSpindleSpeed);
controlRouter.post('/spindle/depth', setSpindleZDepth);
controlRouter.post('/zhome', homeZAxis);

// G-code conversion and execution routes
controlRouter.post('/convert-gcode', convertGcode);
controlRouter.post('/execute-gcode', executeGcode);
controlRouter.get('/gcode-status', getGcodeStatus);
controlRouter.post('/stop-gcode', stopGcode);

export default controlRouter;