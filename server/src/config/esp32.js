// Global ESP32 configuration
export let ESP32_BASE_URL = '';

export const setESP32BaseURL = (ipAddress) => {
    ESP32_BASE_URL = `http://${ipAddress}`;
};