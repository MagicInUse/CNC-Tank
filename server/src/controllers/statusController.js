import axios from 'axios';

let BASE_URL = '';

export const checkStatus = async (req, res) => {
    const { ipAddress } = req.body;
    
    if (!ipAddress) {
        return res.status(400).json({ error: 'IP address is required' });
    }

    try {
        // Update BASE_URL with new IP
        BASE_URL = `http://${ipAddress}`;
        
        // Test connection to ESP32
        const response = await axios.get(`${BASE_URL}/api/status`, {
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