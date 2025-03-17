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

export const toggleLaser = async (req, res) => {
    const { enable } = req.body;

    if (typeof enable !== 'boolean') {
        return res.status(400).json({ error: 'Invalid parameter for laser enable/disable' });
    }

    try {
        const response = await axios.post(`${ESP32_BASE_URL}/api/laser`, { enable });
        res.json(response.data);
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Error connecting to ESP32';
        res.status(500).json({ error: errorMessage });
    }
};

export const toggleSpindle = async (req, res) => {
    const { enable } = req.body;

    if (typeof enable !== 'boolean') {
        return res.status(400).json({ error: 'Invalid parameter for spindle enable/disable' });
    }

    try {
        const response = await axios.post(`${ESP32_BASE_URL}/api/spindle`, { enable });
        res.json(response.data);
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Error connecting to ESP32';
        res.status(500).json({ error: errorMessage });
    }
};

export const setSpindleSpeed = async (req, res) => {
    const { speed } = req.body;

    if (typeof speed !== 'number' || speed < 0 || speed > 100) {
        return res.status(400).json({ error: 'Invalid spindle speed value' });
    }

    try {
        const response = await axios.post(`${ESP32_BASE_URL}/api/spindle/speed`, { speed });
        res.json(response.data);
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Error connecting to ESP32';
        res.status(500).json({ error: errorMessage });
    }
};

export const setSpindleZDepth = async (req, res) => {
    const { step, speed } = req.body;
    if (typeof step !== 'number' && typeof speed !== 'number') {
        return res.status(400).json({ error: 'Invalid spindle Z depth value or speed.' });
    }

    if (!ESP32_BASE_URL) {
        return res.status(400).json({ error: 'ESP32 not connected. Please set IP address first.' });
    }

    try {
        const response = await axios.post(`${ESP32_BASE_URL}/api/spindle/depth`, { step, speed });
        res.json(response.data);
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Error connecting to ESP32';
        res.status(500).json({ error: errorMessage });
    }
};

export const homeZAxis = async (req, res) => {
    if (!ESP32_BASE_URL) {
        return res.status(400).json({ error: 'ESP32 not connected. Please set IP address first.' });
    }

    try {
        const response = await axios.post(`${ESP32_BASE_URL}/api/control/zhome`);
        
        if (response.data.error) {
            return res.status(500).json({ error: response.data.error });
        }

        // Forward success response from ESP32
        res.json(response.data);
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Error during Z-axis homing';
        res.status(500).json({ error: errorMessage });
    }
};