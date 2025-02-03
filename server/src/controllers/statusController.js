import axios from 'axios';
import { ESP32_BASE_URL, setESP32BaseURL } from '../config/esp32.js';

export const checkStatus = async (req, res) => {
    const { ipAddress } = req.body;
    
    if (!ipAddress) {
        return res.status(400).json({ error: 'IP address is required' });
    }

    try {
        // Update ESP32_BASE_URL with new IP
        setESP32BaseURL(ipAddress);
        
        // Test connection to ESP32
        const response = await axios.get(`${ESP32_BASE_URL}/api/status`, {
            timeout: 3000
        });
        
        res.json({ status: 'connected', data: response.data });
    } catch (error) {
        res.status(500).json({ 
            status: 'failed', 
            error: error.response?.data?.error || 'Error connecting to ESP32' 
        });
    }
};