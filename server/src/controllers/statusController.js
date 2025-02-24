import axios from 'axios';
import { ESP32_BASE_URL, setESP32BaseURL } from '../config/esp32.js';
import { ConsoleContext } from '../utils/ConsoleContext.js';

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

export const handleConsoleMessage = (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Assuming you have a way to access the console context
    ConsoleContext.addMessage('info', message);

    res.status(200).json({ status: 'Message received' });
};

export const handleTestCommand = async (req, res) => {
    try {
        // Log the ESP32_BASE_URL
        ConsoleContext.addMessage('info', `Sending test command to ${ESP32_BASE_URL}/api/test`);

        // Send a test command to the ESP32
        const response = await axios.post(`${ESP32_BASE_URL}/api/test`, {
            command: 'test'
        });

        // Log the response to the console
        ConsoleContext.addMessage('response', `Test command response: ${JSON.stringify(response.data)}`);

        res.status(200).json({ status: 'Command sent', data: response.data });
    } catch (error) {
        // Log the full error response
        ConsoleContext.addMessage('error', `Error sending test command: ${error.message}`);
        if (error.response) {
            ConsoleContext.addMessage('error', `Error response data: ${JSON.stringify(error.response.data)}`);
        }

        res.status(500).json({ 
            status: 'failed', 
            error: error.response?.data?.error || 'Error sending test command to ESP32' 
        });
    }
};