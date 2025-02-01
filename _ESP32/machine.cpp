#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

#define stepPin 23
#define dirPin 22
#define enb 27
#define stepsRev 200
#define stepDelay 10

#define revs 2
//Number of desired full revolutions. Negative will reverse direction.
int numRev = 0;

bool revDir = 0;

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
    
    if (!doc["command"].containsKey("axis") || 
        !doc["command"].containsKey("direction") ||
        !doc["command"].containsKey("speed") ||
        !doc["command"].containsKey("step")) {
        server.send(400, "application/json", "{\"error\": \"Missing required parameters\"}");
        return;
    }
    
    String axis = doc["command"]["axis"];
    String direction = doc["command"]["direction"];
    int speed = doc["command"]["speed"];
    float step = doc["command"]["step"];
    
    Serial.println("Received command:");
    Serial.println("Axis: " + axis);
    Serial.println("Direction: " + direction);
    Serial.println("Speed: " + String(speed));
    Serial.println("Step: " + String(step));
    
    StaticJsonDocument<200> response;
    response["status"] = "success";
    response["command"] = doc["command"];
    
    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
}

// Main Setup
void setup() {
    //All pin modes are outputs.
    pinMode(stepPin, OUTPUT);
    pinMode(dirPin, OUTPUT);
    pinMode(enb, OUTPUT);
    
    //Disable stepper at start up.
    digitalWrite(enb, HIGH);

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