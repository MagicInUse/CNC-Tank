// Global ESP32 configuration
export let ESP32_BASE_URL = process.env.ESP32_BASE_URL || 'cnc-tank.local';

export const setESP32BaseURL = (ipAddress) => {
    if (!ipAddress) {
        throw new Error('IP address is required');
    }
    ESP32_BASE_URL = ipAddress.startsWith('http://') ? ipAddress : `http://${ipAddress}`;
};