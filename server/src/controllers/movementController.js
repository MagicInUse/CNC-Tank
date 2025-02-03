import axios from 'axios';
import { ESP32_BASE_URL } from '../config/esp32.js';

export const sendCommand = async (req, res) => {
    const command = req.body;

    if (!command || !command.axis || !command.direction || !command.speed || !command.step) {
        return res.status(400).json({ error: 'Missing required command parameters' });
    }

    if (!ESP32_BASE_URL) {
        return res.status(400).json({ error: 'ESP32 not connected. Please set IP address first.' });
    }

    try {
        // Format command to match ESP32's expected structure
        const commandData = {
            command: {
                axis: command.axis,
                direction: command.direction,
                speed: command.speed,
                step: command.step
            }
        };

        const response = await axios.post(`${ESP32_BASE_URL}/api/control`, commandData);
        res.json(response.data);
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Error connecting to ESP32';
        res.status(500).json({ error: errorMessage });
    }
};