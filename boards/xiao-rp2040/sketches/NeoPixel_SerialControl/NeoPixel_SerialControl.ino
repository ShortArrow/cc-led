#include <Adafruit_NeoPixel.h>

#define POWER_PIN   11
#define DIN_PIN     12
#define LED_COUNT   1
#define BRIGHTNESS  128

Adafruit_NeoPixel pixels(LED_COUNT, DIN_PIN, NEO_GRB + NEO_KHZ800);

// LED state management (non-blocking)
enum LedMode { MODE_OFF, MODE_SOLID, MODE_BLINK1, MODE_BLINK2, MODE_RAINBOW };
LedMode currentMode = MODE_OFF;

uint32_t color1 = 0;
uint32_t color2 = 0;
long blinkInterval = 1000;
bool blinkState = false;

unsigned long previousLedMillis = 0;
int rainbowHue = 0;

// Serial command buffer (non-blocking)
String serialBuffer = "";
bool commandReady = false;

void setup() {
  Serial.begin(9600);
  pinMode(POWER_PIN, OUTPUT);
  digitalWrite(POWER_PIN, HIGH);
  pixels.begin();
  pixels.setBrightness(BRIGHTNESS);
  pixels.clear();
  pixels.show();
}

void loop() {
  // Handle serial communication (non-blocking)
  handleSerial();
  
  // Handle LED updates (non-blocking)
  handleLED();
  
  // Process pending commands (non-blocking)
  if (commandReady) {
    processCommand(serialBuffer);
    serialBuffer = "";
    commandReady = false;
  }
}

void handleSerial() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n') {
      serialBuffer.trim();
      commandReady = true;
      return; // Process one command per loop cycle
    } else {
      serialBuffer += c;
    }
  }
}

void handleLED() {
  unsigned long currentMillis = millis();
  
  switch (currentMode) {
    case MODE_OFF:
    case MODE_SOLID:
      // No periodic updates needed
      break;
      
    case MODE_BLINK1:
    case MODE_BLINK2:
      if (currentMillis - previousLedMillis >= blinkInterval) {
        previousLedMillis = currentMillis;
        blinkState = !blinkState;
        updateLed();
      }
      break;
      
    case MODE_RAINBOW:
      if (currentMillis - previousLedMillis >= blinkInterval) {
        previousLedMillis = currentMillis;
        updateLed();
      }
      break;
  }
}

void processCommand(String cmd) {
  if (cmd == "ON") {
    currentMode = MODE_SOLID;
    color1 = pixels.Color(255, 255, 255);
    updateLed();
    Serial.println("ACCEPTED,ON");
  } 
  else if (cmd == "OFF") {
    currentMode = MODE_OFF;
    updateLed();
    Serial.println("ACCEPTED,OFF");
  } 
  else if (cmd.startsWith("COLOR,")) {
    int r, g, b;
    if (sscanf(cmd.c_str(), "COLOR,%d,%d,%d", &r, &g, &b) == 3) {
      currentMode = MODE_SOLID;
      color1 = pixels.Color(r, g, b);
      updateLed();
      Serial.println("ACCEPTED," + cmd);
    } else {
      Serial.println("REJECT," + cmd + ",invalid format");
    }
  } 
  else if (cmd.startsWith("BLINK1,")) {
    int r, g, b;
    long interval;
    if (sscanf(cmd.c_str(), "BLINK1,%d,%d,%d,%ld", &r, &g, &b, &interval) == 4 && interval > 0) {
      currentMode = MODE_BLINK1;
      color1 = pixels.Color(r, g, b);
      blinkInterval = interval;
      blinkState = false;
      previousLedMillis = millis();
      Serial.println("ACCEPTED," + cmd + ",interval=" + String(blinkInterval));
    } else {
      Serial.println("REJECT," + cmd + ",invalid parameters");
    }
  } 
  else if (cmd.startsWith("BLINK2,")) {
    int r1, g1, b1, r2, g2, b2;
    long interval;
    if (sscanf(cmd.c_str(), "BLINK2,%d,%d,%d,%d,%d,%d,%ld", &r1, &g1, &b1, &r2, &g2, &b2, &interval) == 7 && interval > 0) {
      currentMode = MODE_BLINK2;
      color1 = pixels.Color(r1, g1, b1);
      color2 = pixels.Color(r2, g2, b2);
      blinkInterval = interval;
      blinkState = false;
      previousLedMillis = millis();
      Serial.println("ACCEPTED," + cmd + ",interval=" + String(blinkInterval));
    } else {
      Serial.println("REJECT," + cmd + ",invalid parameters");
    }
  } 
  else if (cmd.startsWith("RAINBOW,")) {
    long interval;
    if (sscanf(cmd.c_str(), "RAINBOW,%ld", &interval) == 1 && interval > 0) {
      currentMode = MODE_RAINBOW;
      blinkInterval = interval;
      rainbowHue = 0;
      previousLedMillis = millis();
      Serial.println("ACCEPTED," + cmd + ",interval=" + String(blinkInterval));
    } else {
      Serial.println("REJECT," + cmd + ",invalid interval");
    }
  } 
  else {
    Serial.println("REJECT," + cmd + ",unknown command");
  }
}

void updateLed() {
  switch (currentMode) {
    case MODE_OFF:
      pixels.clear();
      break;
    case MODE_SOLID:
      pixels.setPixelColor(0, color1);
      break;
    case MODE_BLINK1:
      pixels.setPixelColor(0, blinkState ? 0 : color1);
      blinkState = !blinkState;
      break;
    case MODE_BLINK2:
      pixels.setPixelColor(0, blinkState ? color1 : color2);
      blinkState = !blinkState;
      break;
    case MODE_RAINBOW:
      pixels.setPixelColor(0, pixels.gamma32(pixels.ColorHSV(rainbowHue)));
      rainbowHue += 256; // Increment hue
      if (rainbowHue > 65535) rainbowHue = 0;
      break;
  }
  pixels.show();
}
