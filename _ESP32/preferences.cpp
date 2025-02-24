/*

Small example file for setting non-volatile preferences on the ESP32 using the Preferences library.

Use-case:
Simply set the ssid and password variables, upload the code to the device, and the credentials will be saved to the ESP32's flash memory.
This allows for the credentials to be saved even after a power cycle, and keeps the credentials out of the code.

*/

#include <Preferences.h>

//Create preferences arguments.

Preferences preferences;

const char* ssid = "";
const char* password = "";

void setup() {
  Serial.begin(115200);
  Serial.println();

  preferences.begin("credentials", false);
  preferences.putString("ssid", ssid); 
  preferences.putString("password", password);

  Serial.println("Network Credentials Saved using Preferences");

  preferences.end();
}

void loop() {

}