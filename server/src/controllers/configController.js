import axios from 'axios';
import { ESP32_BASE_URL } from '../config/esp32.js';

const GRBL_DESCRIPTIONS = {
    "$0": "Step pulse time in microseconds",
    "$1": "Step idle delay in milliseconds",
    "$2": "Step pulse invert mask",
    "$3": "Step direction invert mask",
    "$4": "Invert step enable pin",
    "$5": "Invert limit pins",
    "$6": "Invert probe pin",
    "$10": "Status report options mask",
    "$11": "Junction deviation in millimeters",
    "$12": "Arc tolerance in millimeters",
    "$13": "Report in inches",
    "$20": "Soft limits enabled",
    "$21": "Hard limits enabled",
    "$22": "Homing cycle enabled",
    "$23": "Homing direction invert mask",
    "$24": "Homing feed rate in mm/min",
    "$25": "Homing seek rate in mm/min",
    "$26": "Homing debounce delay in milliseconds",
    "$27": "Homing pull-off in millimeters",
    "$30": "Maximum spindle speed in RPM",
    "$31": "Minimum spindle speed in RPM",
    "$32": "Laser mode enabled",
    "$100": "X-axis steps per millimeter",
    "$101": "Y-axis steps per millimeter",
    "$102": "Z-axis steps per millimeter",
    "$110": "X-axis maximum rate in mm/min",
    "$111": "Y-axis maximum rate in mm/min",
    "$112": "Z-axis maximum rate in mm/min",
    "$120": "X-axis acceleration in mm/sec²",
    "$121": "Y-axis acceleration in mm/sec²",
    "$122": "Z-axis acceleration in mm/sec²",
    "$130": "X-axis maximum travel in millimeters",
    "$131": "Y-axis maximum travel in millimeters",
    "$132": "Z-axis maximum travel in millimeters"
};

const getGrblSettingUnit = (description) => {
    if (description.includes('microseconds')) return 'µs';
    if (description.includes('milliseconds')) return 'ms';
    if (description.includes('RPM')) return 'RPM';
    if (description.includes('mm/min')) return 'mm/min';
    if (description.includes('mm/sec²')) return 'mm/sec²';
    if (description.includes('steps per millimeter')) return 'steps/mm';
    if (description.includes('in millimeters') || description.includes('millimeters')) return 'mm';
    
    if (description.includes('mask') || 
        description.includes('enabled') || 
        description.includes('invert')) return null;

    return null;
};

export const getGrblConfig = async (req, res) => {
    try {
        const response = await axios.get(`${ESP32_BASE_URL}/api/config/grbl`, {
            timeout: 3000
        });
        
        const enhancedData = {};
        Object.entries(response.data).forEach(([key, value]) => {
            const description = GRBL_DESCRIPTIONS[key];
            enhancedData[key] = {
                value,
                description,
                unit: getGrblSettingUnit(description)
            }
        });

        res.json({
            settings: enhancedData,
            raw: response.data
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.response?.data?.error || 'Error getting GRBL configuration' 
        });
    }
};

export const updateGrblConfig = async (req, res) => {
    const { key, value } = req.body;

    if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key and value are required' });
    }

    try {
        const response = await axios.post(`${ESP32_BASE_URL}/api/config/grbl`, {
            key,
            value
        }, {
            timeout: 3000
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ 
            error: error.response?.data?.error || 'Error updating GRBL configuration' 
        });
    }
};