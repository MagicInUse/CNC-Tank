//Include all the neccasary libraries.
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h> //Benoit's library
#include <ESPmDNS.h>
#include <Update.h>
#include "FastAccelStepper.h" //Jochen's library
#include <Preferences.h>

//Create preferneces arguments.
Preferences myPrgVar;

//Stepper hardware control pins
#define rightStepperEnb 26
#define rightStepperStep 27
#define rightStepperDir 13
//
#define leftStepperEnb 25
#define leftStepperStep 32
#define leftStepperDir 33
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

//AccelStepper setup
FastAccelStepperEngine engine = FastAccelStepperEngine();
FastAccelStepper *zStepper = NULL;
FastAccelStepper *rightStepper = NULL;
FastAccelStepper *leftStepper = NULL;

//TO-DO Add GRBL global variable here. Consider making these changeable/readable by the webpage.

WebServer server(80);

//Replace with credential bound keys.
String ssid;
String password;

// Change this to your desired hostname - for MDNS
const char* host = "cnc-tank";

// HTML for the update page - this will be for direct updates, not through the tunnel service
const char* serverIndex = R"(
<!DOCTYPE html>
<html>
<body>
    <h2>CNC Tank Firmware Update</h2>
    <form method='POST' action='/update' enctype='multipart/form-data'>
        <input type='file' name='update'>
        <input type='submit' value='Update Firmware'>
    </form>
</body>
</html>
)";

// Endpoint handlers
void handleTestData() {
    server.send(200, "application/json", "{\"temperature\": 25, \"humidity\": 10}");
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

// OTA update handlers
void handleUpdate() {
    server.sendHeader("Connection", "close");
    server.send(200, "text/html", serverIndex);
}

void handleUpdateDone() {
    server.sendHeader("Connection", "close");
    server.send(200, "text/plain", (Update.hasError()) ? "FAIL" : "OK");
    ESP.restart();
}

void handleUpdateUpload() {
    HTTPUpload& upload = server.upload();
    if (upload.status == UPLOAD_FILE_START) {
        Serial.printf("Update: %s\n", upload.filename.c_str());
        if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
            Update.printError(Serial);
        }
    } else if (upload.status == UPLOAD_FILE_WRITE) {
        if (Update.write(upload.buf, upload.currentSize) != upload.currentSize) {
            Update.printError(Serial);
        }
    } else if (upload.status == UPLOAD_FILE_END) {
        if (Update.end(true)) {
            Serial.printf("Update Success: %u\nRebooting...\n", upload.totalSize);
        } else {
            Update.printError(Serial);
        }
    } else if (upload.status == UPLOAD_FILE_ABORTED) {
        Update.end();
        Serial.println("Update aborted");
    }
}

// OTA tunnel update handlers

void handleTunnelUpdate() {
    HTTPUpload& upload = server.upload();
    if (upload.status == UPLOAD_FILE_START) {
        Serial.printf("Tunnel Update: %s\n", upload.filename.c_str());
        
        // Validate file name ends with .bin
        if (!upload.filename.endsWith(".bin")) {
            Serial.println("Invalid file type");
            return;
        }
        
        if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
            Update.printError(Serial);
            return;
        }
        
        Serial.println("Update started");
    } 
    else if (upload.status == UPLOAD_FILE_WRITE) {
        if (Update.write(upload.buf, upload.currentSize) != upload.currentSize) {
            Update.printError(Serial);
            return;
        }
        Serial.printf("Progress: %u bytes\n", upload.totalSize);
    } 
    else if (upload.status == UPLOAD_FILE_END) {
        if (Update.end(true)) {
            Serial.printf("Update Success: %u bytes\nRebooting...\n", upload.totalSize);
        } else {
            Update.printError(Serial);
        }
    }
    else if (upload.status == UPLOAD_FILE_ABORTED) {
        Update.end();
        Serial.println("Update aborted");
    }
}

void handleTunnelUpdateStatus() {
    server.send(200, "text/plain", "Ready for update");
}

void handleUpdatePost() {
    server.sendHeader("Connection", "close");
    server.send(200, "text/plain", (Update.hasError()) ? "FAIL" : "OK");
    delay(1000);
    ESP.restart();
}

void handleApiUpdateGet() {
    StaticJsonDocument<200> response;
    response["version"] = FIRMWARE_VERSION;
    response["used_space"] = ESP.getSketchSize();
    response["free_space"] = ESP.getFreeSketchSpace();
    
    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
}

void handleApiUpdatePost() {
    server.sendHeader("Connection", "close");
    
    StaticJsonDocument<200> response;
    response["success"] = !Update.hasError();
    response["message"] = Update.hasError() ? "Update failed" : "Update successful";
    
    String responseStr;
    serializeJson(response, responseStr);
    
    server.send(200, "application/json", responseStr);
    
    if (!Update.hasError()) {
        delay(500);  // Give time for response to be sent
        ESP.restart();
    }
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

    //Setup steppers
    engine.init();
    zStepper = engine.stepperConnectToPin(zStepperStep);
    rightStepper = engine.stepperConnectToPin(rightStepperStep);
    leftStepper = engine.stepperConnectToPin(leftStepperStep);
    if(zStepper && rightStepper && leftStepper){
      Serial.println("Steppers set");
      zStepper->setDirectionPin(zStepperDir);
      zStepper->setEnablePin(zStepperEnb);
      zStepper->setAutoEnable(true);
      zStepper->setSpeedInUs(5000);
      zStepper->setAcceleration(1000);
      //
      rightStepper->setDirectionPin(rightStepperDir);
      rightStepper->setEnablePin(rightStepperEnb);
      rightStepper->setAutoEnable(true);
      rightStepper->setSpeedInUs(5000);
      rightStepper->setAcceleration(1000);
      //
      leftStepper->setDirectionPin(leftStepperDir);
      leftStepper->setEnablePin(leftStepperEnb);
      leftStepper->setAutoEnable(true);
      leftStepper->setSpeedInUs(5000);
      leftStepper->setAcceleration(1000);
    }else{
      Serial.println("One or more steppers failed to Initilize.");
      Serial.print("Z Stepper:");
      if(zStepper){
        Serial.println(1);
      }else{
        Serial.println(0);
      }
      Serial.print("Right Stepper:");
      if(rightStepper){
        Serial.println(1);
      }else{
        Serial.println(0);
      }
      Serial.print("Left Stepper:");
      if(leftStepper){
        Serial.println(1);
      }else{
        Serial.println(0);
      }
    }

    //Retrieve network credentials for network.
    myPrgVar.begin("credentials", true);
    ssid = myPrgVar.getString("ssid", "");
    password = myPrgVar.getString("password", "");

    if(ssid == "" || password == ""){
      Serial.println("No credentials were found.");
    }

    myPrgVar.end();

    //Run wifi. 
    WiFi.mode(WIFI_AP_STA);
    WiFi.begin(ssid.c_str(), password.c_str());
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
    }
    Serial.println("Connected!");

    // Initialize mDNS
    if (MDNS.begin(host)) {
        Serial.println("mDNS responder started");
    }

    // Endpoint Initialization
    server.on("/api/status", HTTP_GET, handleStatus);
    server.on("/api/test-data", HTTP_GET, handleTestData);
    server.on("/api/control", HTTP_POST, handleControl);
    
    // OTA Update endpoints
    server.on("/update", HTTP_GET, handleUpdate);
    server.on("/update", HTTP_POST, handleUpdatePost, handleUpdateUpload);

    // OTA Tunnel endpoints - via React frontend
    server.on("/api/update", HTTP_GET, handleApiUpdateGet);
    server.on("/api/update", HTTP_POST, handleApiUpdatePost, handleTunnelUpdate);

    
    server.begin();
    MDNS.addService("http", "tcp", 80);
    
    Serial.println("Server started on host: " + WiFi.localIP().toString());
    Serial.printf("OTA Updates available at http://%s.local/update\n", host);
}

// Main Loop
void loop() {
    server.handleClient();
}