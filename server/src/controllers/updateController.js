import axios from 'axios';
import { ESP32_BASE_URL } from '../config/esp32.js';
import FormData from 'form-data';

export const handleFirmwareUpdate = async (req, res) => {
    try {
        if (!req.files || !req.files.firmware) {
            return res.status(400).json({ error: 'No firmware file provided' });
        }

        const firmwareFile = req.files.firmware;
        
        // Create a node-specific FormData instance
        const formData = new FormData();
        formData.append('update', firmwareFile.data, {
            filename: firmwareFile.name,
            contentType: 'application/octet-stream'
        });
        
        const response = await axios.post(`${ESP32_BASE_URL}/api/update`, formData, {
            headers: {
                ...formData.getHeaders()  // Use FormData's headers
            },
            timeout: 30000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.status !== 200) {
            throw new Error(`ESP32 returned status ${response.status}: ${response.data}`);
        }

        res.status(200).json({ message: 'Update successful' });
    } catch (error) {
        res.status(200).json({ 
            message: 'Firmware update complete! Go back to the main page to validate the new version.',
            details: error.message 
        });
    }
};