import axios from 'axios';

let BASE_URL = '';

export const sendCommand = async (req, res) => {
    const { command } = req.body;

    if (!command || !command.axis || !command.direction || !command.speed || !command.step) {
        return res.status(400).json({ error: 'Missing required command parameters' });
    }

    try {
        const response = await axios.post(`${BASE_URL}/api/control`, { command });
        res.json(response.data);
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Error connecting to ESP32';
        res.status(500).json({ error: errorMessage });
    }
};