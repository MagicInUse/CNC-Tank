#include <WiFi.h>
#include <WebServer.h>

WebServer server(80);

// TODO: Replace with your credentials
const char* ssid = "SSID";
const char* password = "PASSWORD";

// Endpoint handlers
void handleTestData() {
    server.send(200, "application/json", "{\"temperature\": 25, \"humidity\": 60}");
}

void handleTestControl() {
    String command = server.arg("command");
    Serial.println("Received command: " + command);
    server.send(200, "text/plain", "Command received");
}

// Main Setup
void setup() {
    // For tethered debugging
    Serial.begin(115200); 

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
    }
    Serial.println("Connected!");

    // Endpoint Initialization
    server.on("/api/test-data", HTTP_GET, handleTestData);
    server.on("/api/control", HTTP_POST, handleTestControl);
    server.begin();
    Serial.println("Server started on host: " + WiFi.localIP().toString());
}

// Main Loop
void loop() {
    server.handleClient();
}