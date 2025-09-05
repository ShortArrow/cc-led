// Simple Serial Debug Test for XIAO RP2040
// Tests basic serial communication

#include <Adafruit_NeoPixel.h>

#define POWER_PIN   11
#define DIN_PIN     12
#define LED_COUNT   1

Adafruit_NeoPixel pixels(LED_COUNT, DIN_PIN, NEO_GRB + NEO_KHZ800);
String serialBuffer = "";

void setup() {
  // Initialize NeoPixel first
  pinMode(POWER_PIN, OUTPUT);
  digitalWrite(POWER_PIN, HIGH);
  pixels.begin();
  pixels.setBrightness(128);
  pixels.clear();
  pixels.show();
  
  // Start serial and wait for connection
  Serial.begin(9600);
  while (!Serial) {
    delay(10); // Wait for serial port to connect
  }
  
  Serial.println("SerialDebug started!");
  Serial.println("Send commands to test serial communication");
  Serial.flush();
  
  // Initial blink to show it's running
  for(int i = 0; i < 3; i++) {
    pixels.setPixelColor(0, pixels.Color(0, 255, 0));
    pixels.show();
    delay(200);
    pixels.clear();
    pixels.show();
    delay(200);
  }
  
  Serial.println("Ready for commands!");
}

void loop() {
  // Echo everything back immediately
  while (Serial.available() > 0) {
    char c = Serial.read();
    Serial.print("Got: ");
    Serial.println((int)c);
    
    if (c == '\n') {
      Serial.print("Command: ");
      Serial.println(serialBuffer);
      Serial.println("ACCEPTED");
      Serial.flush();
      
      // Visual feedback
      pixels.setPixelColor(0, pixels.Color(255, 0, 0));
      pixels.show();
      delay(100);
      pixels.clear();
      pixels.show();
      
      serialBuffer = "";
    } else {
      serialBuffer += c;
    }
  }
}