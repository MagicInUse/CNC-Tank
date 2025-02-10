import axios from 'axios';
import { ESP32_BASE_URL, getESP32FreeSpace } from '../config/esp32.js';
import FormData from 'form-data';

export const checkUpdateStatus = async (req, res) => {
    try {
        const response = await axios.get(`${ESP32_BASE_URL}/api/update`);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            message: 'Failed to check update status',
            details: error.message 
        });
    }
};

export const handleFirmwareUpdate = async (req, res) => {
    try {
        if (!req.files || !req.files.firmware) {
            return res.status(400).json({ error: 'No firmware file provided' });
        }

        const firmwareFile = req.files.firmware;
        
        // Validate file extension
        if (!firmwareFile.name.endsWith('.bin')) {
            return res.status(400).json({ error: 'Invalid file type. Only .bin files are allowed' });
        }

        // Use the getESP32FreeSpace function instead of ESP global
        if (firmwareFile.size > getESP32FreeSpace()) {
            return res.status(400).json({ error: 'Firmware file too large' });
        }

        // Remove version check for now as it's causing issues
        // const currentVersion = await axios.get(`${ESP32_BASE_URL}/api/test-data`);
        // if (currentVersion.data.firmware_version === newVersion) {
        //     return res.status(400).json({ error: 'Same firmware version' });
        // }

        const formData = new FormData();
        formData.append('update', firmwareFile.data, {
            filename: firmwareFile.name,
            contentType: 'application/octet-stream'
        });
        
        const response = await axios.post(`${ESP32_BASE_URL}/api/update`, formData, {
            headers: {
                ...formData.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 30000
        });

        // TODO: Add data stream to response during upload from server to ESP32

        if (response.status === 200) {
            res.status(200).json({ 
                success: true,
                message: 'Firmware update successful! Device will restart.',
                details: 'The ESP32 will reboot to apply the update.'
            });
        } else {
            throw new Error(`Update failed with status ${response.status}`);
        }
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Update failed',
            details: error.message 
        });
    }
};