//Include all the neccasary libraries.
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h> //Benoit's library
#include <ESPmDNS.h>
#include <Update.h>
#include "FastAccelStepper.h" //Jochen's library
#include <Preferences.h>

//Firmware version to be updated on major milestones - Version tracking
#define FIRMWARE_VERSION "1.0.09"

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

//Webserver Object
WebServer server(80);

//Preferences Object.
Preferences myPrgVar;

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
    StaticJsonDocument<200> doc;
    // Get the internal temperature sensor reading
    uint8_t temperature = temperatureRead();
    doc["internal_temperature"] = temperature;
    // Get the chip ID
    uint32_t chipId = ESP.getEfuseMac();
    doc["chip_id"] = chipId;
    // Get the firmware version
    doc["firmware_version"] = FIRMWARE_VERSION;
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
}

// TODO: Implement this function, or remove it
// Send a console message to the server, without a prompt from the server
// 
// void handleTestCommand() {
//     StaticJsonDocument<200> doc;
//     // Get the internal temperature sensor reading
//     uint8_t temperature = temperatureRead();
//     doc["internal_temperature"] = temperature;
//     // Get the chip ID
//     uint32_t chipId = ESP.getEfuseMac();
//     doc["chip_id"] = chipId;
//     // Get the firmware version
//     doc["firmware_version"] = FIRMWARE_VERSION;
    
//     String response;
//     serializeJson(doc, response);
//     Serial.println("Test data: " + response);

//     // Send a console message back to the server
//     sendConsoleMessage("Test command executed: " + response);
// }

void handleStatus() {
    StaticJsonDocument<200> response;
    response["status"] = "connected";
    
    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
}

// Send a console message to the server, this function's survivability is based on handleTestCommand()
//
// void sendConsoleMessage(const String& message) {
//     HTTPClient http;
//     const char* serverName = "http://cnc-base.local:3001/api/status/console"; // Replace with your Node server address and port

//     // Prepare JSON payload
//     StaticJsonDocument<200> doc;
//     doc["message"] = message;

//     String requestBody;
//     serializeJson(doc, requestBody);

//     // Configure HTTPClient
//     http.begin(serverName);
//     http.addHeader("Content-Type", "application/json");

//     // Send HTTP POST request
//     int httpResponseCode = http.POST(requestBody);

//     // Check the response
//     if (httpResponseCode > 0) {
//         String response = http.getString();
//         Serial.println("Server response: " + response);
//     } else {
//         Serial.println("Error sending console message: " + String(httpResponseCode));
//     }

//     // End the HTTP connection
//     http.end();
// }

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
    
    sendConsoleMessage("Received command: Axis=" + axis + ", Direction=" + direction + ", Speed=" + String(speed) + ", Step=" + String(step));
    
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

//TO-DO Select correct types for the keys. Not all keys are floats. Make sure to assign "N" for Null to unused settings.
//Create a namespace for GRBL. Or check for its existance.
void handleGrblSetup(){
  myPrgVar.begin("GBRL", false);
  bool keyPresent = myPrgVar.isKey("$0");
  if(keyPresent){
      Serial.println("Keys are already present!");
      return;
  }
  //Settings 2, 3, 4, 5, 6, 26, 32 are all non - use scenarios for the time being.
  else{
    Serial.println("Keys are needed! Adding...");
    myPrgVar.putFloat("$0", 1.0);
    myPrgVar.putFloat("$1", 2.0);
    myPrgVar.putFloat("$2", 3.0);
    myPrgVar.putFloat("$3", 4.0);
    myPrgVar.putFloat("$4", 5.0);
    myPrgVar.putFloat("$5", 6.0);
    myPrgVar.putFloat("$6", 7.0);
    myPrgVar.putFloat("$10", 8.0);
    myPrgVar.putFloat("$11", 9.0);
    myPrgVar.putFloat("$12", 10.0);
    myPrgVar.putFloat("$13", 11.0);
    myPrgVar.putFloat("$20", 12.0);
    myPrgVar.putFloat("$21", 13.0);
    myPrgVar.putFloat("#22", 14.0);
    myPrgVar.putFloat("$23", 15.0);
    myPrgVar.putFloat("$24", 16.0);
    myPrgVar.putFloat("$25", 17.0);
    myPrgVar.putFloat("$26", 18.0);
    myPrgVar.putFloat("$27", 19.0);
    myPrgVar.putFloat("$30", 20.0);
    myPrgVar.putFloat("$31", 21.0);
    myPrgVar.putFloat("$32", 22.0);
    myPrgVar.putFloat("$100", 23.0);
    myPrgVar.putFloat("$101", 24.0);
    myPrgVar.putFloat("$102", 25.0);
    myPrgVar.putFloat("$110", 26.0);
    myPrgVar.putFloat("$111", 27.0);
    myPrgVar.putFloat("$112", 28.0);
    myPrgVar.putFloat("$120", 29.0);
    myPrgVar.putFloat("$121", 30.0);
    myPrgVar.putFloat("$122", 31.0);
    myPrgVar.putFloat("$130", 32.0);
    myPrgVar.putFloat("$131", 33.0);
    myPrgVar.putFloat("$132", 34.0);
  }
  myPrgVar.end();
}

//TO-DO expand this function to be able to respond to a server.
//Create a function that iterates through keys in the namespcae GRBL and prints them to the Serial Monitor for Testing.
void GRBLtest(String setting, bool mode){
  myPrgVar.begin("GBRL", mode);
  float storedVal = myPrgVar.getFloat(setting.c_str(), 0);
  Serial.print("Setting at key: ");
  Serial.print(setting);
  Serial.print(" is: ");
  Serial.println(storedVal);
  myPrgVar.end();
}

//TO-DO function to start/stop spindle. With speed varying from 0-255. The enable should remain low for now. As to prevent exciting run away events.
void spindle(bool isEnabled, int speed){
  digitalWrite(spindleEnb, isEnabled);
  analogWrite(spindlePWM, speed);
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

    //Test for the existance of and/or create the GRBL variable map. Seperate function.
    handleGrblSetup();

    //Print three samples (for a sanity check)
    GRBLtest("$1", true);
    GRBLtest("$121", true);
    GRBLtest("$132", true);


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
    // TODO: Implement this function, or remove it, based on what handleTestCommand does
    // server.on("/api/test", HTTP_POST, handleTestCommand);
    
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