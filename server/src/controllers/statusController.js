import axios from 'axios';
import { networkInterfaces } from 'os';
import { ESP32_BASE_URL, setESP32BaseURL } from '../config/esp32.js';
import { ConsoleContext } from '../utils/ConsoleContext.js';

const getServerIPAddress = (port) => {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e., 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return `${net.address}:${port}`;
            }
        }
    }
    return `localhost:${port}`;
};

export const checkStatus = async (req, res) => {
    const { ipAddress } = req.body;
    
    if (!ipAddress) {
        return res.status(400).json({ error: 'IP address is required' });
    }

    try {
        // Update ESP32_BASE_URL with new IP
        setESP32BaseURL(ipAddress);
        
        // Get the server's IP address with port
        const serverIPAddress = getServerIPAddress(req.socket.localPort);
        
        // Test connection to ESP32
        const response = await axios.get(`${ESP32_BASE_URL}/api/status`, {
            params: { serverAddress: serverIPAddress },
            timeout: 3000
        });

        // Get update information including free space
        const updateResponse = await axios.get(`${ESP32_BASE_URL}/api/update`, {
            timeout: 3000
        });
        
        res.json({ 
            status: 'connected', 
            data: response.data,
            update: updateResponse.data // Include update information
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'failed', 
            error: error.response?.data?.error || 'Error connecting to ESP32' 
        });
    }
};

export const handleConsoleMessage = (req, res) => {
    const { type, message } = req.body;
    if (!type || !message) {
        return res.status(400).json({ error: 'Type and message are required' });
    }

    ConsoleContext.addMessage(type, message);

    res.status(200).json({ status: 'Message received' });
};