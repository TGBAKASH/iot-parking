/*
 * FOCUSED LEFT-SIDE PIN SEARCH
 * EN is GPIO 12 or 13 (confirmed by blink in groups 4,5,7)
 * Data pins must be from left-side GPIOs: 14, 25, 26, 27, 32, 33
 * Trying ALL orderings we haven't tested yet!
 */

#include <LiquidCrystal.h>

int allPins[] = {0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33};

void groundAll() {
  for (int i = 0; i < 20; i++) {
    pinMode(allPins[i], OUTPUT);
    digitalWrite(allPins[i], LOW);
  }
  delay(10);
}

void tryIt(int n, int rs, int en, int d4, int d5, int d6, int d7) {
  groundAll();
  delay(40);
  LiquidCrystal lcd(rs, en, d4, d5, d6, d7);
  lcd.begin(16, 2);
  delay(50);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("YES! #");
  lcd.print(n);
  lcd.setCursor(0, 1);
  lcd.print(d4);lcd.print(",");lcd.print(d5);lcd.print(",");
  lcd.print(d6);lcd.print(",");lcd.print(d7);
  delay(1200);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== FOCUSED LEFT-SIDE SEARCH ===");
  Serial.println("RS/EN = 12/13, Data from {14,25,26,27,32,33}");
  Serial.println("Testing ALL orderings!\n");

  int n = 1;

  // Data group: {14, 25, 26, 27} - ALL 24 permutations
  // RS=13, EN=12
  Serial.println("--- {14,25,26,27} RS=13 EN=12 ---");
  tryIt(n++,13,12, 14,25,26,27); tryIt(n++,13,12, 14,25,27,26);
  tryIt(n++,13,12, 14,26,25,27); tryIt(n++,13,12, 14,26,27,25);
  tryIt(n++,13,12, 14,27,25,26); tryIt(n++,13,12, 14,27,26,25);
  tryIt(n++,13,12, 25,14,26,27); tryIt(n++,13,12, 25,14,27,26);
  tryIt(n++,13,12, 25,26,14,27); tryIt(n++,13,12, 25,26,27,14);
  tryIt(n++,13,12, 25,27,14,26); tryIt(n++,13,12, 25,27,26,14);
  tryIt(n++,13,12, 26,14,25,27); tryIt(n++,13,12, 26,14,27,25);
  tryIt(n++,13,12, 26,25,14,27); tryIt(n++,13,12, 26,25,27,14);
  tryIt(n++,13,12, 26,27,14,25); tryIt(n++,13,12, 26,27,25,14);
  tryIt(n++,13,12, 27,14,25,26); tryIt(n++,13,12, 27,14,26,25);
  tryIt(n++,13,12, 27,25,14,26); tryIt(n++,13,12, 27,25,26,14);
  tryIt(n++,13,12, 27,26,14,25); tryIt(n++,13,12, 27,26,25,14);

  // RS=12, EN=13
  Serial.println("--- {14,25,26,27} RS=12 EN=13 ---");
  tryIt(n++,12,13, 14,25,26,27); tryIt(n++,12,13, 14,25,27,26);
  tryIt(n++,12,13, 14,26,25,27); tryIt(n++,12,13, 14,26,27,25);
  tryIt(n++,12,13, 14,27,25,26); tryIt(n++,12,13, 14,27,26,25);
  tryIt(n++,12,13, 25,14,26,27); tryIt(n++,12,13, 25,14,27,26);
  tryIt(n++,12,13, 25,26,14,27); tryIt(n++,12,13, 25,26,27,14);
  tryIt(n++,12,13, 25,27,14,26); tryIt(n++,12,13, 25,27,26,14);
  tryIt(n++,12,13, 26,14,25,27); tryIt(n++,12,13, 26,14,27,25);
  tryIt(n++,12,13, 26,25,14,27); tryIt(n++,12,13, 26,25,27,14);
  tryIt(n++,12,13, 26,27,14,25); tryIt(n++,12,13, 26,27,25,14);
  tryIt(n++,12,13, 27,14,25,26); tryIt(n++,12,13, 27,14,26,25);
  tryIt(n++,12,13, 27,25,14,26); tryIt(n++,12,13, 27,25,26,14);
  tryIt(n++,12,13, 27,26,14,25); tryIt(n++,12,13, 27,26,25,14);

  // Data groups including 32 and 33
  Serial.println("--- Groups with 32/33 ---");
  // {25,26,27,32}
  tryIt(n++,13,12, 25,26,27,32); tryIt(n++,13,12, 32,27,26,25);
  tryIt(n++,12,13, 25,26,27,32); tryIt(n++,12,13, 32,27,26,25);
  tryIt(n++,13,12, 27,26,25,32); tryIt(n++,12,13, 27,26,25,32);
  tryIt(n++,13,12, 32,25,26,27); tryIt(n++,12,13, 32,25,26,27);
  // {25,26,27,33}
  tryIt(n++,13,12, 25,26,27,33); tryIt(n++,13,12, 33,27,26,25);
  tryIt(n++,12,13, 25,26,27,33); tryIt(n++,12,13, 33,27,26,25);
  // {26,27,32,33}
  tryIt(n++,13,12, 26,27,32,33); tryIt(n++,13,12, 33,32,27,26);
  tryIt(n++,12,13, 26,27,32,33); tryIt(n++,12,13, 33,32,27,26);
  tryIt(n++,13,12, 32,33,26,27); tryIt(n++,12,13, 32,33,26,27);
  tryIt(n++,13,12, 27,26,33,32); tryIt(n++,12,13, 27,26,33,32);
  // {14,25,32,33}
  tryIt(n++,13,12, 14,25,32,33); tryIt(n++,13,12, 33,32,25,14);
  tryIt(n++,12,13, 14,25,32,33); tryIt(n++,12,13, 33,32,25,14);
  // {14,26,32,33}
  tryIt(n++,13,12, 14,26,32,33); tryIt(n++,13,12, 33,32,26,14);
  tryIt(n++,12,13, 14,26,32,33); tryIt(n++,12,13, 33,32,26,14);
  // {14,27,32,33}
  tryIt(n++,13,12, 14,27,32,33); tryIt(n++,13,12, 33,32,27,14);
  tryIt(n++,12,13, 14,27,32,33); tryIt(n++,12,13, 33,32,27,14);
  // {25,26,32,33}
  tryIt(n++,13,12, 25,26,32,33); tryIt(n++,13,12, 33,32,26,25);
  tryIt(n++,12,13, 25,26,32,33); tryIt(n++,12,13, 33,32,26,25);
  // {25,27,32,33}
  tryIt(n++,13,12, 25,27,32,33); tryIt(n++,13,12, 33,32,27,25);
  tryIt(n++,12,13, 25,27,32,33); tryIt(n++,12,13, 33,32,27,25);

  Serial.printf("\n=== DONE! %d combos tested ===\n", n-1);
  Serial.println("If YES! appeared, tell me the number!");
}

void loop() {}
