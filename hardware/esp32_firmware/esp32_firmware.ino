/*
 * ============================================================================
 * ESP32 + IR SENSORS + 16x2 LCD DISPLAY SMART PARKING FIRMWARE
 * ============================================================================
 * Hardware Component Overview (Matches PCB Kit):
 * 1. ESP32 NodeMCU Development Board (Center 30-pin microcontroller)
 * 2. 16x2 Character LCD Display (Top screen)
 * 3. IR Sensor Modules (Active low obstacle sensors)
 * 4. Relay Module & LEDs
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ----------------------------------------------------------------------------
// Wi-Fi Credentials & Backend API Endpoint Configuration
// ----------------------------------------------------------------------------
const char* ssid = "Akash";          // Replace with your local Wi-Fi SSID
const char* password = "12345678";  // Replace with your local Wi-Fi Password

// Deployed Render Server Endpoint
const char* serverUrl = "https://iot-parking-system.onrender.com/updateParking";

// Secret ESP32 Header Key for Security
const char* apiKey = "default_esp32_secret_key_123";

// Target Parking Lot ID registered in PostgreSQL database
const int PARKING_ID = 1;

// Define IR Sensor Pins on ESP32
const int SLOT_1_PIN = 4;
const int SLOT_2_PIN = 5;
const int SLOT_3_PIN = 18;
const int SLOT_4_PIN = 19;

// Initialize 16x2 I2C LCD (Address 0x3F)
LiquidCrystal_I2C lcd(0x3F, 16, 2);

// Store previous state of slots to send HTTP requests ONLY when state changes
bool lastStateSlot1 = false;
bool lastStateSlot2 = false;
bool lastStateSlot3 = false;
bool lastStateSlot4 = false;

// Function Prototypes
void connectToWiFi();
void updateLCDDisplay(int freeSlots);
void sendSlotStatusToBackend(int slotNumber, bool isOccupied);

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================================");
  Serial.println("🤖 ESP32 Smart Parking System Initializing...");
  Serial.println("========================================================");

  // Scan common ESP32 I2C pin pairs
  int pinPairs[][2] = {
    {21, 22}, {13, 14}, {26, 27}, {16, 17}, {4, 5}, {32, 33}, {18, 19}
  };
  
  byte foundAddress = 0;
  int foundSDA = -1, foundSCL = -1;

  for (int i = 0; i < 7; i++) {
    int sda = pinPairs[i][0];
    int scl = pinPairs[i][1];
    Wire.begin(sda, scl);
    delay(50);
    
    for (byte addr = 1; addr < 127; addr++) {
      Wire.beginTransmission(addr);
      if (Wire.endTransmission() == 0) {
        Serial.printf("✨ FOUND I2C DEVICE AT ADDRESS 0x%02X ON PINS SDA=%d, SCL=%d!\n", addr, sda, scl);
        foundAddress = addr;
        foundSDA = sda;
        foundSCL = scl;
      }
    }
  }

  if (foundAddress != 0) {
    Wire.begin(foundSDA, foundSCL);
    lcd = LiquidCrystal_I2C(foundAddress, 16, 2);
    lcd.init();
    lcd.begin(16, 2);
    lcd.backlight();
    lcd.clear();
  } else {
    Serial.println("⚠️ No I2C LCD found on any pins. LCD is wired in Parallel 4-bit mode.");
  }
  delay(100);
  
  lcd.setCursor(0, 0);
  lcd.print("Smart Parking");
  lcd.setCursor(0, 1);
  lcd.print("WiFi Connecting..");

  // Configure IR sensor pins as digital inputs
  pinMode(SLOT_1_PIN, INPUT);
  pinMode(SLOT_2_PIN, INPUT);
  pinMode(SLOT_3_PIN, INPUT);
  pinMode(SLOT_4_PIN, INPUT);

  // Connect to Wi-Fi network
  connectToWiFi();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Active!");
  delay(1500);
}

void loop() {
  // Ensure Wi-Fi connection is active
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Read IR Sensors (Active LOW sensors: LOW = Car Present/Occupied, HIGH = Slot Free)
  bool currentStateSlot1 = (digitalRead(SLOT_1_PIN) == LOW);
  bool currentStateSlot2 = (digitalRead(SLOT_2_PIN) == LOW);
  bool currentStateSlot3 = (digitalRead(SLOT_3_PIN) == LOW);
  bool currentStateSlot4 = (digitalRead(SLOT_4_PIN) == LOW);

  // Calculate free slots
  int occupiedCount = (currentStateSlot1 ? 1 : 0) + (currentStateSlot2 ? 1 : 0) + (currentStateSlot3 ? 1 : 0) + (currentStateSlot4 ? 1 : 0);
  int freeSlots = 4 - occupiedCount;

  // Update physical 16x2 LCD display
  updateLCDDisplay(freeSlots);

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

  delay(300); // Check sensor pins every 300ms
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
 * Updates physical 16x2 LCD display screen
 */
void updateLCDDisplay(int freeSlots) {
  lcd.setCursor(0, 0);
  lcd.print("Smart Parking Hub");
  lcd.setCursor(0, 1);
  lcd.print("Free Slots: ");
  lcd.print(freeSlots);
  lcd.print("/4  ");
}

/**
 * Sends HTTP POST request to backend /updateParking endpoint
 */
void sendSlotStatusToBackend(int slotNumber, bool isOccupied) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Cannot send HTTP POST: Wi-Fi disconnected.");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // Skip strict SSL cert validation for Render HTTPS endpoint

  HTTPClient http;
  http.begin(client, serverUrl);
  http.setTimeout(15000); // 15s timeout
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-ESP32-API-KEY", apiKey);

  // Construct JSON Payload: { "parking_id": 1, "slot_number": 1, "is_occupied": true }
  StaticJsonDocument<200> jsonDoc;
  jsonDoc["parking_id"] = PARKING_ID;
  jsonDoc["slot_number"] = slotNumber;
  jsonDoc["is_occupied"] = isOccupied;

  String jsonString;
  serializeJson(jsonDoc, jsonString);

  Serial.print("🚀 Sending Payload to Cloud Backend: ");
  Serial.println(jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("✅ Server HTTP Response Code: %d\n", httpResponseCode);
  } else {
    Serial.printf("❌ Error Sending HTTP POST: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}
