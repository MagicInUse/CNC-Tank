import express from 'express';
import { setESP32BaseURL } from '../../../config/esp32.js';

const configRouter = express.Router();

configRouter.post('/', (req, res) => {
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

export default configRouter;