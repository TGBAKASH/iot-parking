/*
 * ============================================================================
 * ESP32 SMART PARKING - ENTRY/EXIT COUNTER SYSTEM
 * ============================================================================
 * Hardware:
 *   - IR Sensor 1 (GPIO 32) = ENTRY detector
 *   - IR Sensor 2 (GPIO 33) = EXIT detector
 *   - 16x2 LCD: RS=25, EN=26, D4=4, D5=17, D6=19, D7=21
 *
 * Logic:
 *   - Car passes entry sensor → count goes UP
 *   - Car passes exit sensor → count goes DOWN
 *   - Maps count to virtual "slots" for the website
 *   - Example: count=3 means slots 1,2,3 occupied, slots 4,5 free
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <LiquidCrystal.h>

// Wi-Fi Credentials
const char* ssid = "Akash";
const char* password = "12345678";

// Render Server Endpoint
const char* serverUrl = "https://iot-parking-system.onrender.com/updateParking";

// ESP32 API Key
const char* apiKey = "default_esp32_secret_key_123";

// Parking Lot ID
const int PARKING_ID = 1;

// Total parking capacity
const int MAX_SLOTS = 4;

// LCD Pins (from original PCB code)
const int rs = 25, en = 26, d4 = 4, d5 = 17, d6 = 19, d7 = 21;
LiquidCrystal lcd(rs, en, d4, d5, d6, d7);

// IR Sensor Pins (from original PCB code)
const int ENTRY_SENSOR = 32;  // Car entering
const int EXIT_SENSOR = 33;   // Car leaving

// Current car count inside parking
int carCount = 0;

// Debounce flags (prevent double counting)
bool entryFlag = false;
bool exitFlag = false;

void connectToWiFi();
void syncAllSlotsToBackend();
void sendSlotUpdate(int slotNumber, bool isOccupied);
void updateLCD();

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================================");
  Serial.println("  Smart Parking System - Entry/Exit Counter");
  Serial.println("  Entry Sensor: GPIO 32 | Exit Sensor: GPIO 33");
  Serial.printf("  Max Capacity: %d slots\n", MAX_SLOTS);
  Serial.println("========================================================\n");

  // Initialize LCD
  lcd.begin(16, 2);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Parking");
  lcd.setCursor(0, 1);
  lcd.print("Starting...");

  // Configure sensor pins
  pinMode(ENTRY_SENSOR, INPUT);
  pinMode(EXIT_SENSOR, INPUT);

  // Connect to Wi-Fi
  connectToWiFi();

  // Sync initial state (all slots free)
  syncAllSlotsToBackend();
  updateLCD();

  Serial.println("System Ready!\n");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Read sensors (LOW = car detected, HIGH = no car)
  bool entryDetected = (digitalRead(ENTRY_SENSOR) == LOW);
  bool exitDetected = (digitalRead(EXIT_SENSOR) == LOW);

  // --- ENTRY: Car going in ---
  if (entryDetected && !entryFlag) {
    entryFlag = true;
    if (carCount < MAX_SLOTS) {
      carCount++;
      Serial.printf(">> CAR ENTERED | Count: %d/%d\n", carCount, MAX_SLOTS);

      // Mark the next slot as occupied
      sendSlotUpdate(carCount, true);
      updateLCD();
    } else {
      Serial.println(">> PARKING FULL! Entry blocked.");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("PARKING FULL!");
      lcd.setCursor(0, 1);
      lcd.print("No Space Left");
      delay(2000);
      updateLCD();
    }
  } else if (!entryDetected && entryFlag) {
    entryFlag = false;  // Reset when car passes
  }

  // --- EXIT: Car going out ---
  if (exitDetected && !exitFlag) {
    exitFlag = true;
    if (carCount > 0) {
      // Free the last occupied slot
      sendSlotUpdate(carCount, false);
      carCount--;
      Serial.printf("<< CAR EXITED  | Count: %d/%d\n", carCount, MAX_SLOTS);
      updateLCD();
    } else {
      Serial.println("<< Exit detected but count already 0");
    }
  } else if (!exitDetected && exitFlag) {
    exitFlag = false;  // Reset when car passes
  }

  delay(100);
}

void updateLCD() {
  int available = MAX_SLOTS - carCount;
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Parking");
  lcd.setCursor(0, 1);
  lcd.print("Available: ");
  lcd.print(available);
  lcd.print("/");
  lcd.print(MAX_SLOTS);
}

void syncAllSlotsToBackend() {
  Serial.println("Syncing all slots to backend...");
  for (int i = 1; i <= MAX_SLOTS; i++) {
    bool occupied = (i <= carCount);
    sendSlotUpdate(i, occupied);
  }
  Serial.println("Sync complete!\n");
}

void sendSlotUpdate(int slotNumber, bool isOccupied) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  http.begin(client, serverUrl);
  http.setTimeout(15000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-ESP32-API-KEY", apiKey);

  StaticJsonDocument<200> jsonDoc;
  jsonDoc["parking_id"] = PARKING_ID;
  jsonDoc["slot_number"] = slotNumber;
  jsonDoc["is_occupied"] = isOccupied;

  String payload;
  serializeJson(jsonDoc, payload);

  Serial.printf("  Slot %d -> %s ", slotNumber, isOccupied ? "OCCUPIED" : "FREE");

  int code = http.POST(payload);
  if (code > 0) {
    Serial.printf("[HTTP %d]\n", code);
  } else {
    Serial.printf("[FAILED: %s]\n", http.errorToString(code).c_str());
  }
  http.end();
}

void connectToWiFi() {
  Serial.printf("Connecting to WiFi: %s", ssid);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connecting");
  lcd.setCursor(0, 1);
  lcd.print(ssid);

  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    delay(2000);
  } else {
    Serial.println("\nWiFi Failed. Retrying...");
  }
}
