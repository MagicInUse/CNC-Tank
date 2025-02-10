#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h> //Benoit's library
#include <ESPmDNS.h>
#include <Update.h>

#define stepPin 23
#define dirPin 22
#define enb 27
#define stepsMM 10

//Number of desired full revolutions. Negative will reverse direction.
int numRev = 0;
bool revDir = 0;

WebServer server(80);

// TODO: Replace with your credentials
const char* ssid = "";
const char* password = "";
const char* host = "cnc-tank"; // Change this to your desired hostname

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

    if (axis == "z" && direction == "up") {
        zMove(step, speed, direction);
    }
    else if (axis == "z" && direction == "down") {
        zMove(step, speed, direction);
    }
    else {
        server.send(400, "application/json", "{\"error\": \"Invalid axis or direction\"}");
        return;
    }
    
    StaticJsonDocument<200> response;
    response["status"] = "success";
    response["command"] = doc["command"];
    
    String responseStr;
    serializeJson(response, responseStr);
    server.send(200, "application/json", responseStr);
}

//TO-DO get direction reveresed/not reveresed as bool
//Function takes the distance desired "step" multiplies it be the step per mm, and delays "speed" #ms between steps. And a string of up/down
void zMove(int step, int speed, String rev){
  digitalWrite(enb, LOW);//Enable stepper
  if(rev == "up"){
    digitalWrite(dirPin, LOW);
  }else{
    digitalWrite(dirPin, HIGH);
  }
  for(int i = 0; i <= step * stepsMM; i++){
    digitalWrite(stepPin, HIGH);
    delay(speed);
    digitalWrite(stepPin, LOW);
    delay(speed);
  }
  digitalWrite(enb, HIGH);//Disable stepper.
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
    }
}

// Main Setup
void setup() {
    //All pin modes are outputs.
    pinMode(stepPin, OUTPUT);
    pinMode(dirPin, OUTPUT);
    pinMode(enb, OUTPUT);
    
    //Disable stepper(s) at start up.
    digitalWrite(enb, HIGH);

    // For tethered debugging
    Serial.begin(115200); 

    WiFi.mode(WIFI_AP_STA);
    WiFi.begin(ssid, password);
    
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
    server.on("/update", HTTP_POST, handleUpdateDone, handleUpdateUpload);
    
    server.begin();
    MDNS.addService("http", "tcp", 80);
    
    Serial.println("Server started on host: " + WiFi.localIP().toString());
    Serial.printf("OTA Updates available at http://%s.local/update\n", host);
}

// Main Loop
void loop() {
    server.handleClient();
}