/*
    CNC-Tank Code:

    Groundwork laid for remote communications. To include the transmission of possible errors through console logs, Over the Air Updates, and the ability to control all three
    stepper motors, the spindle, and the laser.

    TO-DOs - Updated 02/24/2025 @ 11:55AM

    Cautions - Program storage is almost full. Consider removing any unused libraries or functions, and most tethered serial messages need to be removed or commented out to save
    storage space.
*/

//Include all the neccasary libraries.
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h> //Benoit's library
#include <ESPmDNS.h>
#include <Update.h>
#include "FastAccelStepper.h" //Jochen's library
#include <Preferences.h>
#include <HTTPClient.h>

//Firmware version to be updated on major milestones - Version tracking
#define FIRMWARE_VERSION "1.0.12"

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

//Spindle PWM pin - and PWM properties.
#define spindlePWM 2
#define analogFreq 1000
#define analogRes 8 

//Accesories (I2C or other Options)
#define laser 4

//Homing specific params
volatile bool homeStop = false;

//AccelStepper setup
FastAccelStepperEngine engine = FastAccelStepperEngine();
FastAccelStepper *zStepper = NULL;
FastAccelStepper *rightStepper = NULL;
FastAccelStepper *leftStepper = NULL;

//Webserver Object
WebServer server(80);

//Preferences Object.
Preferences myPrgVar;

//ISRs for hardware interrupt(Z probing and Z homing)
void IRAM_ATTR homingStop(){
  homeStop = true;
  //Allow the processor to think without ISR being hammered.
  detachInterrupt(zEndStop);
}

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
String serverAddress = ""; // Global variable to store the server address

//Consider this function if space becomes a problem - otherwise, leave it as is.
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

//Let the server no we are here!
void handleStatus() {
    if (server.hasArg("serverAddress")) {
        serverAddress = server.arg("serverAddress");
        Serial.println("Server address set to: " + serverAddress);

        // Send initial console message
        sendConsoleMessage("info", "Hello, I'm ready to go!");
    }

    StaticJsonDocument<200> response;
    response["status"] = "connected";
    
    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
}

// Send a console message to the server - for debugging through the client-visible console.
void sendConsoleMessage(const String& type, const String& message) {
    if (serverAddress == "") {
        Serial.println("Server address not set. Cannot send console message.");
        return;
    }

    HTTPClient http;
    String serverName = "http://" + serverAddress + "/api/status/console";

    // Prepare JSON payload
    StaticJsonDocument<200> doc;
    doc["type"] = type;
    doc["message"] = message;

    String requestBody;
    serializeJson(doc, requestBody);

    // Configure HTTPClient
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    // Send HTTP POST request
    int httpResponseCode = http.POST(requestBody);

    // Check the response
    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println("Server response: " + response);
    } else {
        Serial.println("Error sending console message: " + String(httpResponseCode));
        Serial.println("HTTPClient error: " + http.errorToString(httpResponseCode));
    }

    // End the HTTP connection
    http.end();
}

//TO-DO Add a switch on/off for the Laser. Laser SHOULD not be left running for long periods of time. Consider adding a non-blocking timer.
void handleLaser() {
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

    if (!doc.containsKey("enable")) {
        server.send(400, "application/json", "{\"error\": \"Missing required parameter: enable\"}");
        return;
    }

    bool enable = doc["enable"];
    digitalWrite(laser, enable ? HIGH : LOW);

    StaticJsonDocument<200> response;
    response["status"] = "success";
    response["laser"] = enable ? "enabled" : "disabled";

    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
}

//TO-DO Probably remove this function. As the spindle should be controlled by the handleSpindleSpeed function. Might use this as a "playground" for testing purposes.
void handleSpindle() {
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

    if (!doc.containsKey("enable")) {
        server.send(400, "application/json", "{\"error\": \"Missing required parameter: enable\"}");
        return;
    }

    bool enable = doc["enable"];
    digitalWrite(spindleEnb, enable ? HIGH : LOW);

    StaticJsonDocument<200> response;
    response["status"] = "success";
    response["spindle"] = enable ? "enabled" : "disabled";

    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
}

//TO-DO Receive spindle state as "M" codes. M03 for enable, M05 for disable followed by integer value of 0-255 for PWM.
void handleSpindleSpeed() {
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

    if (!doc.containsKey("speed")) {
        server.send(400, "application/json", "{\"error\": \"Missing required parameter: speed\"}");
        return;
    }

    int speed = doc["speed"];
    if (speed < 0 || speed > 100) {
        server.send(400, "application/json", "{\"error\": \"Invalid spindle speed value\"}");
        return;
    }

    ledcWrite(spindlePWM, map(speed, 0, 100, 0, 255));

    StaticJsonDocument<200> response;
    response["status"] = "success";
    response["spindle_speed"] = speed;

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
        delay(1000);  // Give time for response to be sent
        ESP.restart();
    }
}

//Function checks for the first GRBL setting key:value pair. If it doesn't exist, it creates all the key value pairs for GRBL settings. If it does exist, it does nothing.
//Create a namespace for GRBL. Or check for its existance.
void handleGrblSetup(){
  myPrgVar.begin("GBRL", false);
  bool keyPresent = myPrgVar.isKey("$0");
  if(keyPresent){
      Serial.println("Keys are already present!");
      return;
  }
  // Settings 2, 3, 4, 5, 6, 26, 32 are all non - use scenarios for the time being.
  else {
    myPrgVar.putInt("$0", 10); // Step pulse time, microseconds
    myPrgVar.putInt("$1", 25); // Step idle delay, milliseconds
    myPrgVar.putShort("$2", 0); // Step pulse invert, mask
    myPrgVar.putShort("$3", 0); // Step direction invert, mask
    myPrgVar.putBool("$4", 0); // Invert step enable pin, boolean
    myPrgVar.putBool("$5", 0); // Invert limit pins, boolean
    myPrgVar.putBool("$6", 0); // Invert probe pin, boolean
    myPrgVar.putShort("$10", 1); // Status report options, mask
    myPrgVar.putFloat("$11", 0.010); // Junction deviation, millimeters
    myPrgVar.putFloat("$12", 0.002); // Arc tolerance, millimeters
    myPrgVar.putBool("$13", false); // Report in inches, boolean
    myPrgVar.putBool("$20", false); // Soft limits, boolean
    myPrgVar.putBool("$21", false); // Hard limits, boolean
    myPrgVar.putBool("$22", false); // Homing cycle, boolean
    myPrgVar.putShort("$23", 0); // Homing direction invert, mask
    myPrgVar.putFloat("$24", 25.000); // Homing feed, mm/min
    myPrgVar.putFloat("$25", 500.000); // Homing seek, mm/min
    myPrgVar.putInt("$26", 250); // Homing debounce, milliseconds
    myPrgVar.putFloat("$27", 1.000); // Homing pull-off, millimeters
    myPrgVar.putInt("$30", 10000); // Maximum spindle speed, RPM
    myPrgVar.putInt("$31", 1000); // Minimum spindle speed, RPM
    myPrgVar.putBool("$32", false); // Laser mode, boolean
    myPrgVar.putFloat("$100", 250.000); // X-axis steps per millimeter
    myPrgVar.putFloat("$101", 250.000); // Y-axis steps per millimeter
    myPrgVar.putFloat("$102", 250.000); // Z-axis steps per millimeter
    myPrgVar.putFloat("$110", 500.000); // X-axis maximum rate, mm/min
    myPrgVar.putFloat("$111", 500.000); // Y-axis maximum rate, mm/min
    myPrgVar.putFloat("$112", 500.000); // Z-axis maximum rate, mm/min
    myPrgVar.putFloat("$120", 10.000); // X-axis acceleration, mm/sec^2
    myPrgVar.putFloat("$121", 10.000); // Y-axis acceleration, mm/sec^2
    myPrgVar.putFloat("$122", 10.000); // Z-axis acceleration, mm/sec^2
    myPrgVar.putFloat("$130", 200.000); // X-axis maximum travel, millimeters
    myPrgVar.putFloat("$131", 200.000); // Y-axis maximum travel, millimeters
    myPrgVar.putFloat("$132", 200.000); // Z-axis maximum travel, millimeters
  }
   myPrgVar.end();
}

//On connection to the server, the server will send the current GRBL settings to the client.
void handleGrblStatus() {
    myPrgVar.begin("GBRL", true);
    
    StaticJsonDocument<1024> response;
    
    response["$0"] = myPrgVar.getInt("$0");
    response["$1"] = myPrgVar.getInt("$1");
    response["$2"] = myPrgVar.getShort("$2");
    response["$3"] = myPrgVar.getShort("$3");
    response["$4"] = myPrgVar.getBool("$4");
    response["$5"] = myPrgVar.getBool("$5");
    response["$6"] = myPrgVar.getBool("$6");
    response["$10"] = myPrgVar.getShort("$10");
    response["$11"] = myPrgVar.getFloat("$11");
    response["$12"] = myPrgVar.getFloat("$12");
    response["$13"] = myPrgVar.getBool("$13");
    response["$20"] = myPrgVar.getBool("$20");
    response["$21"] = myPrgVar.getBool("$21");
    response["$22"] = myPrgVar.getBool("$22");
    response["$23"] = myPrgVar.getShort("$23");
    response["$24"] = myPrgVar.getFloat("$24");
    response["$25"] = myPrgVar.getFloat("$25");
    response["$26"] = myPrgVar.getInt("$26");
    response["$27"] = myPrgVar.getFloat("$27");
    response["$30"] = myPrgVar.getInt("$30");
    response["$31"] = myPrgVar.getInt("$31");
    response["$32"] = myPrgVar.getBool("$32");
    response["$100"] = myPrgVar.getFloat("$100");
    response["$101"] = myPrgVar.getFloat("$101");
    response["$102"] = myPrgVar.getFloat("$102");
    response["$110"] = myPrgVar.getFloat("$110");
    response["$111"] = myPrgVar.getFloat("$111");
    response["$112"] = myPrgVar.getFloat("$112");
    response["$120"] = myPrgVar.getFloat("$120");
    response["$121"] = myPrgVar.getFloat("$121");
    response["$122"] = myPrgVar.getFloat("$122");
    response["$130"] = myPrgVar.getFloat("$130");
    response["$131"] = myPrgVar.getFloat("$131");
    response["$132"] = myPrgVar.getFloat("$132");
    
    myPrgVar.end();
    
    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
}

//When the client sends a GRBL update, the server will update the GRBL settings with the new values.
void handleGrblUpdate() {
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

    if (!doc.containsKey("key") || !doc.containsKey("value") || !doc.containsKey("type")) {
        server.send(400, "application/json", "{\"error\": \"Missing required parameters\"}");
        return;
    }

    const char* key = doc["key"];
    const char* type = doc["type"];

    myPrgVar.begin("GBRL", false);
    
    bool success = false;
    if (strcmp(type, "int") == 0) {
        success = myPrgVar.putInt(key, doc["value"].as<int>());
    } else if (strcmp(type, "short") == 0) {
        success = myPrgVar.putShort(key, doc["value"].as<short>());
    } else if (strcmp(type, "bool") == 0) {
        success = myPrgVar.putBool(key, doc["value"].as<bool>());
    } else if (strcmp(type, "float") == 0) {
        success = myPrgVar.putFloat(key, doc["value"].as<float>());
    }
    
    myPrgVar.end();

    //In case any of the settings are updated, the accelerations need to be updated as well.
    setAccelerations();
    
    if (success) {
        StaticJsonDocument<200> response;
        response["status"] = "success";
        response[key] = doc["value"];
        
        String responseStr;
        serializeJson(response, responseStr);
        server.send(200, "application/json", responseStr);
    } else {
        server.send(500, "application/json", "{\"error\": \"Failed to update setting\"}");
    }
}

void setAccelerations(){
    //Capture the required parameters from the namespace, "GRBL"
    myPrgVar.begin("GBRL", true);
    //Four parameters - Xacceleration, Yacceleration, Zacceleration
    float xAccel = myPrgVar.getFloat("$120");
    float yAccel = myPrgVar.getFloat("$121");
    float zAccel = myPrgVar.getFloat("$122");
    myPrgVar.end();
    //Set the accelerations for the steppers.
    zStepper->setAcceleration(zAccel);
    rightStepper->setAcceleration(yAccel);
    leftStepper->setAcceleration(xAccel);
}

//TODO Function Needs to receive commands from the console and execute them. Expected to turn the robot in the direction specified by the command.
//rates are based off the X GRBL data
void handleControl() {
    myPrgVar.begin("GBRL", true);
    //Required parameters = X-Axis steps/mm, X max rate, Y-Axis steps/mm, Y max rate
    float xSpeed = myPrgVar.getFloat("$110");
    float xStepsPerMM = myPrgVar.getFloat("$100");
    // float ySpeed = myPrgVar.getFloat("$111");
    // float yStepsPerMM = myPrgVar.getFloat("$101");
    myPrgVar.end();
    
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
    
    int direction = doc["direction"];
    int speed = doc["speed"];
    int step = doc["step"];

    sendConsoleMessage("info","Step=" + String(step) + 
                              ", Speed=" + String(speed) +
                              ", Direction=" + String(direction));

    if (speed == 0 ||
        step == 0 ||
        direction == 0) {
        server.send(400, "application/json", "{\"error\": \"Missing required parameters\"}");
        return;
    }
    
    //Enforce maximum speed. (Based off left track for now.)
    if(speed > xSpeed){
      speed = xSpeed;
    }

    // Calculate steps based on direction
    int leftSteps = 0;
    int rightSteps = 0;

    //Calculate the number of steps required for the left and right tracks.
    step = round(step * xStepsPerMM);

    //Calculate the delay between steps
    speed = round((xStepsPerMM * speed) / 60);
    
    //Will need to add logic for the direction invert pin mask. For now, assume that the direction is correct.
    switch (direction) {
        case 0: // forward - both tracks forward at equal speed - if it doesn't go straight towards the motors - reverse the phases at the stepper driver.
            leftSteps = rightSteps = step;
            break;
        case 1: // backward - both tracks backward at equal speed
            leftSteps = rightSteps = -step;
            break;
        case 2: // forwardLeft - left track at half speed, right track at full speed
            leftSteps = step/2;
            rightSteps = step;
            break;
        case 3: // forwardRight - left track at full speed, right track at half speed
            leftSteps = step;
            rightSteps = step/2;
            break;
        case 4: // turnLeft - left track backward, right track forward (spin in place)
            leftSteps = -step;
            rightSteps = step;
            break;
        case 5: // turnRight - left track forward, right track backward (spin in place)
            leftSteps = step;
            rightSteps = -step;
            break;
        case 6: // backwardLeft - left track at half backward speed
            leftSteps = -step;
            rightSteps = -step/2;
            break;
        case 7: // backwardRight - right track at half backward speed
            leftSteps = -step/2;
            rightSteps = -step;
            break;
        default:
            leftSteps = rightSteps = 0;
            break;
    }

    // Execute movement
    if (stepperController(leftSteps, rightSteps, 0, speed, speed, 0)) {
        StaticJsonDocument<200> response;
        response["status"] = "success";
        response["direction"] = direction;
        response["speed"] = speed;
        response["step"] = step;
        
        String responseStr;
        serializeJson(response, responseStr);
        server.send(200, "application/json", responseStr);
    } else {
        server.send(500, "application/json", "{\"error\": \"Movement failed\"}");
    }
}

void handleSpindleZDepth() {
    myPrgVar.begin("GBRL", true);
    //Four parameters - Zsteps/mm, Zmax rate, zAccleration, z max travel, soft limits
    float zSpeed = myPrgVar.getFloat("$112");
    float zStepsPerMM = myPrgVar.getFloat("$102");
    float zAccel = myPrgVar.getFloat("$122");
    float zMaxTravel = myPrgVar.getFloat("$132");
    bool softLimits = myPrgVar.getBool("$20");
    myPrgVar.end();
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
    
    int speed = doc["speed"];
    int step = doc["step"];
    if (speed == 0 ||
        step == 0) {
        server.send(400, "application/json", "{\"error\": \"Missing keys\"}");
        return;
    }
    //To-DO Use new stepper control function to accept commands from console.
    //Enforce soft limits if enabled.
    if(softLimits){
      if((step * zStepsPerMM) > (zMaxTravel * zStepsPerMM)){
        server.send(400, "application/json", "{\"error\": \"Z depth exceeds maximum travel\"}");
        return;
      }
    }

    //Enforce maximum speed.
    if(speed > zSpeed){
      speed = zSpeed;
    }

    //Determine period for the step delay
    speed = round((zStepsPerMM * speed) / 60);

    //Determine the actual number of steps required:
    step = round(step * zStepsPerMM);

    //Run the stepper control function.
    stepperController(0, 0, step, 0, 0, zSpeed);

    sendConsoleMessage("info", "Step=" + String(step) + 
                              ", Speed=" + String(speed));

    StaticJsonDocument<200> response;
    response["status"] = "success";
    response["command"] = doc["command"];
    
    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
}

void handleHoming() {
    StaticJsonDocument<200> response;

    // Send initial status
    sendConsoleMessage("info", "Starting Z-axis homing sequence...");

    // Run zHoming and check for failures
    if (!zHoming()) {
        response["error"] = "Z-axis homing failed. Check hardware and settings.";
        String responseStr;
        serializeJson(response, responseStr);
        server.send(500, "application/json", responseStr);
        return;
    }

    // Success response
    response["status"] = "success";
    response["message"] = "Z-axis homing completed successfully";
    
    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
    
    // Notify client of success
    sendConsoleMessage("success", "Z-axis homing completed");
}

//Function needs to accept the axis of movement indicated by > 0, and the speed in Us for that axis...
//Might require a period master argument as well to determine blocking based off of period instead of distance. 
bool stepperController(int leftSteps, int rightSteps, int zSteps, int leftPeriod, int rightPeriod, int zPeriod){
    //Configure speeds for the steppers.
    zStepper->setSpeedInHz(zPeriod);
    leftStepper->setSpeedInHz(leftPeriod);
    rightStepper->setSpeedInHz(rightPeriod);
    //Acclerations should be constant...
    //Check for the maximum number of steps to be the blocking variable. Left and Right should move together. In case left has the most steps:
    if(abs(leftSteps) > abs(rightSteps) && abs(leftSteps) > abs(zSteps)){
      zStepper->move(zSteps);
      rightStepper->move(rightSteps);
      leftStepper->move(leftSteps, true);
    //In case right has most number of steps
    }else if(abs(rightSteps) > abs(leftSteps) && abs(rightSteps) > abs(zSteps)){
      zStepper->move(zSteps);
      leftStepper->move(leftSteps);
      rightStepper->move(rightSteps, true);
    //In case of Z requiring the most steps:
    }else if(abs(zSteps) > abs(leftSteps) && abs(zSteps) > abs(rightSteps)){
      rightStepper->move(rightSteps);
      leftStepper->move(leftSteps);
      zStepper->move(zSteps, true);
    //Off chance that all three steppers have equal steps to perform. Default to Z being blocking.
    }else{
      rightStepper->move(rightSteps);
      leftStepper->move(leftSteps);
      zStepper->move(zSteps, true);
    }

    return true; //Indicates that all blocking functions have completed.

}


bool zHoming(){
  //Capture the required parameters from the namespace, "GRBL"
  myPrgVar.begin("GBRL", true);
  //Four parameters - Zsteps/mm, Homing speed in US, zAccleration, Homing Pull Off
  float zHomingSpeed = myPrgVar.getFloat("$24");
  float zStepsPerMM = myPrgVar.getFloat("$102");
  float zStepOff = myPrgVar.getFloat("$27");
  float zAccel = myPrgVar.getFloat("$122");
  int zDebounce = myPrgVar.getInt("$26");
  myPrgVar.end();
  //Check for any zero values implying that something is incorrect with GRBL
  if(zHomingSpeed == 0.0, zStepsPerMM == 0.0, zStepOff == 0.0, zAccel == 0.0){
    return false;
  }else{
    //Calculate steps needed per second: steps/mm * mm/min = steps required per minute / 60 seconds/min = steps per second (Hz)
    zHomingSpeed = (zStepsPerMM * zHomingSpeed) / 60;
    //Calculate steps needed to meet the pull-off distance: steps required = zStepOff * zStepsPerMM
    zStepOff = zStepsPerMM * zStepOff;
  }
  //Set speed variables.
  zStepper->setSpeedInHz(round(zHomingSpeed));
  zStepper->setAcceleration(zAccel);
  //Replace with desired ISR and ONLOW mode.
  attachInterrupt(zEndStop, homingStop, ONLOW);
  //Run backwards until limit is triggered
  zStepper->runBackward();
  while(!homeStop);
  //Finish stepping.
  zStepper->forceStop();
  digitalWrite(zStepperEnb, LOW);
  Serial.println("ISR Fired");
  //Step off the endstop until trigger goes high
  delay(zDebounce);
  do{
    zStepper->forwardStep(true);
  }while(digitalRead(zEndStop) == 0);
  //Finish stepping
  digitalWrite(zStepperEnb, LOW);
  zStepper->forceStop();
  //Make homing pull off blocking so function does not advance.
  zStepper->move(zStepOff, true);
  zStepper->setCurrentPosition(0);
  //TO-DO: Attach danger interrupt if required
  //Allow outside functions to know safety is complete.
  homeStop = false;
  return true;
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

    //Configure Analogwrite Fucntionality
    ledcAttach(spindlePWM, analogFreq, analogRes);
    
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

    setAccelerations();

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
    server.on("/api/config/grbl", HTTP_GET, handleGrblStatus);
    server.on("/api/config/grbl", HTTP_POST, handleGrblUpdate);
    server.on("/api/test-data", HTTP_GET, handleTestData);
    server.on("/api/control", HTTP_POST, handleControl);
    server.on("/api/laser", HTTP_POST, handleLaser);
    server.on("/api/spindle", HTTP_POST, handleSpindle);
    server.on("/api/spindle/speed", HTTP_POST, handleSpindleSpeed);
    server.on("/api/spindle/depth", HTTP_POST, handleSpindleZDepth);
    server.on("/api/control/zhome", HTTP_POST, handleHoming);
    
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