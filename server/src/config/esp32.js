// Global ESP32 configuration
export let ESP32_BASE_URL = process.env.ESP32_BASE_URL || 'http://cnc-tank.local';

export const setESP32BaseURL = (ipAddress) => {
    if (!ipAddress) {
        throw new Error('IP address is required');
    }
    ESP32_BASE_URL = ipAddress.startsWith('http://') ? ipAddress : `http://${ipAddress}`;
};

// Add a function to get available space (mock for ESP32)
export const getESP32FreeSpace = () => {
    // ESP32 typically has around 1.2MB available for firmware
    return 1258291; // approx 1.2MB in bytes
};