#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

WebServer server(80);

// TODO: Replace with your credentials
const char* ssid = "SSID";
const char* password = "PASSWORD";

// Endpoint handlers
void handleTestData() {
    server.send(200, "application/json", "{\"temperature\": 25, \"humidity\": 60}");
}

void handleTestControl() {
    if (server.hasArg("plain") == false) {
        server.send(400, "application/json", "{\"error\": \"No data received\"}");
        return;
    }
    
    String body = server.arg("plain");
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, body);
    
    if (error) {
        server.send(400, "application/json", "{\"error\": \"Invalid JSON\"}");
        return;
    }
    
    if (!doc.containsKey("command")) {
        server.send(400, "application/json", "{\"error\": \"Missing command parameter\"}");
        return;
    }
    
    String command = doc["command"];
    Serial.println("Received command: " + command);
    
    if (command == "ON" || command == "OFF") {
        StaticJsonDocument<200> response;  // Changed from JsonDocument
        response["status"] = "success";
        response["command"] = command;
        
        String responseStr;
        serializeJson(response, responseStr);
        server.send(200, "application/json", responseStr);
    } else {
        server.send(400, "application/json", "{\"error\": \"Invalid command value\"}");
    }
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