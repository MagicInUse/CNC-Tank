import express from 'express';
import { getGrblConfig, updateGrblConfig } from '../../../controllers/configController.js';
import { setESP32BaseURL } from '../../../config/esp32.js';

const configRouter = express.Router();

// /api/config/esp32
configRouter.post('/esp32', (req, res) => {
    try {
        const { ipAddress } = req.body;
        if (!ipAddress) {
            return res.status(400).json({ error: 'IP address is required' });
        }
        setESP32BaseURL(ipAddress);
        res.json({ success: true, message: 'ESP32 IP address updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// /api/config/grbl
configRouter.get('/grbl', getGrblConfig);
configRouter.post('/grbl', updateGrblConfig);

export default configRouter;