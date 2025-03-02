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

const getGrblSettingType = (key) => {
    const intSettings = ['$0', '$1', '$26', '$30', '$31'];
    const shortSettings = ['$2', '$3', '$10', '$23'];
    const boolSettings = ['$4', '$5', '$6', '$13', '$20', '$21', '$22', '$32'];
    
    if (intSettings.includes(key)) return 'int';
    if (shortSettings.includes(key)) return 'short';
    if (boolSettings.includes(key)) return 'bool';
    return 'float';
};

export const getGrblConfig = async (req, res) => {
    try {
        const response = await axios.get(`${ESP32_BASE_URL}/api/config/grbl`, {
            timeout: 3000
        });
        
        const enhancedData = {};
        Object.entries(response.data).forEach(([key, value]) => {
            const description = GRBL_DESCRIPTIONS[key];
            const type = getGrblSettingType(key);
            
            // Convert boolean responses from ESP32 to number (0/1)
            const processedValue = type === 'bool' ? Number(value) : value;
            
            enhancedData[key] = {
                value: processedValue,
                description,
                unit: getGrblSettingUnit(description),
                type
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

    // Validate and convert the value based on setting type
    const settingType = getGrblSettingType(key);
    let processedValue;

    try {
        switch (settingType) {
            case 'int':
                processedValue = parseInt(value);
                break;
            case 'short':
                processedValue = parseInt(value);
                if (processedValue < -32768 || processedValue > 32767) {
                    throw new Error('Value out of range for short');
                }
                break;
            case 'bool':
                processedValue = Boolean(value);
                break;
            case 'float':
                processedValue = parseFloat(value);
                break;
        }

        if (isNaN(processedValue) && settingType !== 'bool') {
            throw new Error('Invalid numeric value');
        }
    } catch (error) {
        return res.status(400).json({ 
            error: `Invalid value for setting type ${settingType}: ${error.message}` 
        });
    }

    try {
        const response = await axios.post(`${ESP32_BASE_URL}/api/config/grbl`, {
            key,
            value: processedValue,
            type: settingType
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ 
            error: error.response?.data?.error || 'Error updating GRBL configuration' 
        });
    }
};