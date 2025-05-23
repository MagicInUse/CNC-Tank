import axios from 'axios';
import { ESP32_BASE_URL } from '../config/esp32.js';

const DIRECTION_MAP = {
    'forward': 0,      // straight -> forward for clarity
    'backward': 1,     // unchanged
    'forwardLeft': 2,  // forwardLeft45 -> forwardLeft for simplicity
    'forwardRight': 3, // forwardRight45 -> forwardRight for simplicity
    'turnLeft': 4,     // standingLeft45 -> turnLeft for clarity
    'turnRight': 5,    // standingRight45 -> turnRight for clarity
    'backwardLeft': 6, // backwardLeft45 -> backwardLeft for simplicity
    'backwardRight': 7 // backwardRight45 -> backwardRight for simplicity
};

export const sendCommand = async (req, res) => {
    const { direction, speed, step } = req.body;

    if (!direction || !speed || !step) {
        return res.status(400).json({ error: 'Missing required command parameters' });
    }

    if (!ESP32_BASE_URL) {
        return res.status(400).json({ error: 'ESP32 not connected. Please set IP address first.' });
    }

    // Convert direction string to integer
    const directionCode = DIRECTION_MAP[direction];
    if (directionCode === undefined) {
        return res.status(400).json({ 
            error: `Invalid direction command. Valid directions are: ${Object.keys(DIRECTION_MAP).join(', ')}`
        });
    }

    try {
        const direction = directionCode;
        const response = await axios.post(`${ESP32_BASE_URL}/api/control`, { direction, speed, step });
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