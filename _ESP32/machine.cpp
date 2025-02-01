#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h> //Benoit's library

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
    int step = doc["command"]["step"];
    
    Serial.println("Received command:");
    Serial.println("Axis: " + axis);
    Serial.println("Direction: " + direction);
    Serial.println("Speed: " + String(speed));
    Serial.println("Step: " + String(step));

    if (axis == 'z' && direction == 'up') {
        zMove(direction, speed, step);
    }
    else if (axis == 'z' && direction == 'down') {
        zMove(direction, speed, step);
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