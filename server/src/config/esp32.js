// Global ESP32 configuration
export let ESP32_BASE_URL = '';

export const setESP32BaseURL = (ipAddress) => {
    if (!ipAddress) {
        throw new Error('IP address is required');
    }
    ESP32_BASE_URL = `http://${ipAddress}`;
};