#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h> //Benoit's library
#include "FastAccelStepper.h" //Jochen's library

//Stepper hardware control pins
#define rightStepperEnb 19
#define rightStepperStep 18
#define rightStepperDir 23
//
#define leftStepperStepperEnb 19
#define leftStepperStep 18
#define leftStepperDir 23
//
#define zStepperEnb 19
#define zStepperStep 18
#define zStepperDir 23

//Z-Probe and upper limit switch.
#define zEndStop 35
#define zProbe 34

//Relay controls
#define spindleEnb 16
#define outletEnb 17

//Spindle PWM pin
#define spindlePWM 2

//Accesories (I2C or other Options)
#define laser 4

//TO-DO Add GRBL global variable here. Consider making these changeable/readable by the webpage.

WebServer server(80);

// TODO: Replace with your credentials
const char* ssid = "";
const char* password = "";

// Endpoint handlers
void handleTestData() {
    server.send(200, "application/json", "{\"temperature\": 25, \"humidity\": 60}");
}

void handleStatus() {
    StaticJsonDocument<200> response;
    response["status"] = "connected";
    
    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
}

void handleControl() {
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
    int step = doc["command"]["step"];
    
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
    //Pin modes. Will need any "extras" added in later
    pinMode(spindleEnb, OUTPUT);
    pinMode(spindlePWM, OUTPUT);//Will need to be configured with proper frequency and resolution.
    pinMode(outletEnb, OUTPUT);
    pinMode(laser, OUTPUT);
    pinMode(zEndStop, INPUT);//10k Pullup on board. This pin is input only.
    pinMode(zProbe, INPUT);//"

    //Immediately take all outputs low.
    digitalWrite(spindleEnb, 0);
    digitalWrite(spindlePWM, 0);
    digitalWrite(outletEnb, 0);
    digitalWrite(laser, 0);
    
    // For tethered debugging
    Serial.begin(115200); 

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
    }
    Serial.println("Connected!");

    // Endpoint Initialization
    server.on("/api/status", HTTP_GET, handleStatus);
    server.on("/api/test-data", HTTP_GET, handleTestData);
    server.on("/api/control", HTTP_POST, handleControl);
    server.begin();
    Serial.println("Server started on host: " + WiFi.localIP().toString());
}

// Main Loop
void loop() {
    server.handleClient();
}