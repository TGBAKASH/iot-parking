/*
 * ============================================================================
 * ESP32 + IR SENSORS SMART PARKING FIRMWARE
 * ============================================================================
 * Hardware Required:
 * 1. ESP32 NodeMCU Development Board
 * 2. IR Sensor Modules (FC-51 or active IR obstacle sensors)
 * 3. Jumper Wires & Breadboard / PCB
 * 
 * Pin Configuration:
 * - IR Sensor Slot 1 Output -> ESP32 GPIO 4
 * - IR Sensor Slot 2 Output -> ESP32 GPIO 5
 * - IR Sensor Slot 3 Output -> ESP32 GPIO 18
 * - IR Sensor Slot 4 Output -> ESP32 GPIO 19
 * - IR Sensor VCC -> ESP32 3.3V / 5V
 * - IR Sensor GND -> ESP32 GND
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ----------------------------------------------------------------------------
// Wi-Fi Credentials & Backend API Endpoint Configuration
// ----------------------------------------------------------------------------
const char* ssid = "YOUR_WIFI_SSID";          // Replace with your Wi-Fi SSID
const char* password = "YOUR_WIFI_PASSWORD";  // Replace with your Wi-Fi Password

// URL of your deployed Render backend (or local backend IP during testing e.g. http://192.168.1.100:5000/updateParking)
const char* serverUrl = "https://your-render-backend-url.onrender.com/updateParking";

// Target Parking Lot ID registered in PostgreSQL database
const int PARKING_ID = 1;

// Define IR Sensor Pins on ESP32
const int SLOT_1_PIN = 4;
const int SLOT_2_PIN = 5;
const int SLOT_3_PIN = 18;
const int SLOT_4_PIN = 19;

// Store previous state of slots to send HTTP requests ONLY when state changes
bool lastStateSlot1 = false;
bool lastStateSlot2 = false;
bool lastStateSlot3 = false;
bool lastStateSlot4 = false;

// Function Prototypes
void connectToWiFi();
void sendSlotStatusToBackend(int slotNumber, bool isOccupied);

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================================");
  Serial.println("🤖 ESP32 Smart Parking Sensor Node Initializing...");
  Serial.println("========================================================");

  // Configure IR sensor pins as digital inputs
  pinMode(SLOT_1_PIN, INPUT);
  pinMode(SLOT_2_PIN, INPUT);
  pinMode(SLOT_3_PIN, INPUT);
  pinMode(SLOT_4_PIN, INPUT);

  // Connect to Wi-Fi network
  connectToWiFi();
}

void loop() {
  // Ensure Wi-Fi connection is active
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Read IR Sensors (Active LOW sensors: LOW = Obstacle/Car Present, HIGH = Slot Empty)
  bool currentStateSlot1 = (digitalRead(SLOT_1_PIN) == LOW);
  bool currentStateSlot2 = (digitalRead(SLOT_2_PIN) == LOW);
  bool currentStateSlot3 = (digitalRead(SLOT_3_PIN) == LOW);
  bool currentStateSlot4 = (digitalRead(SLOT_4_PIN) == LOW);

  // Slot 1 State Change Detection
  if (currentStateSlot1 != lastStateSlot1) {
    Serial.printf("⚡ Slot 1 State Changed -> %s\n", currentStateSlot1 ? "OCCUPIED" : "FREE");
    sendSlotStatusToBackend(1, currentStateSlot1);
    lastStateSlot1 = currentStateSlot1;
  }

  // Slot 2 State Change Detection
  if (currentStateSlot2 != lastStateSlot2) {
    Serial.printf("⚡ Slot 2 State Changed -> %s\n", currentStateSlot2 ? "OCCUPIED" : "FREE");
    sendSlotStatusToBackend(2, currentStateSlot2);
    lastStateSlot2 = currentStateSlot2;
  }

  // Slot 3 State Change Detection
  if (currentStateSlot3 != lastStateSlot3) {
    Serial.printf("⚡ Slot 3 State Changed -> %s\n", currentStateSlot3 ? "OCCUPIED" : "FREE");
    sendSlotStatusToBackend(3, currentStateSlot3);
    lastStateSlot3 = currentStateSlot3;
  }

  // Slot 4 State Change Detection
  if (currentStateSlot4 != lastStateSlot4) {
    Serial.printf("⚡ Slot 4 State Changed -> %s\n", currentStateSlot4 ? "OCCUPIED" : "FREE");
    sendSlotStatusToBackend(4, currentStateSlot4);
    lastStateSlot4 = currentStateSlot4;
  }

  delay(500); // Check sensor pins every 500ms
}

/**
 * Helper function to connect ESP32 to local Wi-Fi router
 */
void connectToWiFi() {
  Serial.print("📶 Connecting to Wi-Fi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Wi-Fi Connected!");
    Serial.print("📍 ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Wi-Fi Connection Failed. Will retry in loop.");
  }
}

/**
 * Sends HTTP POST request to backend /updateParking endpoint
 */
void sendSlotStatusToBackend(int slotNumber, bool isOccupied) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Cannot send HTTP POST: Wi-Fi disconnected.");
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON Payload: { "parking_id": 1, "slot_number": 1, "is_occupied": true }
  StaticJsonDocument<200> jsonDoc;
  jsonDoc["parking_id"] = PARKING_ID;
  jsonDoc["slot_number"] = slotNumber;
  jsonDoc["is_occupied"] = isOccupied;

  String jsonString;
  serializeJson(jsonDoc, jsonString);

  Serial.print("🚀 Sending Payload to Backend: ");
  Serial.println(jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("✅ Server HTTP Response Code: %d\n", httpResponseCode);
    Serial.println("Response: " + response);
  } else {
    Serial.printf("❌ Error Sending HTTP POST: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}
