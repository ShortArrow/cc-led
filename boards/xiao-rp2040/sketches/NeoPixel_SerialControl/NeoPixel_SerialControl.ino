#include <Adafruit_NeoPixel.h>

#define POWER_PIN   11
#define DIN_PIN     12
#define LED_COUNT   1
#define BRIGHTNESS  128

Adafruit_NeoPixel pixels(LED_COUNT, DIN_PIN, NEO_GRB + NEO_KHZ800);

// --- State Variables for non-blocking operations ---
enum LedMode { MODE_OFF, MODE_SOLID, MODE_BLINK1, MODE_BLINK2, MODE_RAINBOW };
LedMode currentMode = MODE_OFF;

uint32_t color1 = 0;
uint32_t color2 = 0;
int blinkInterval = 1000;
bool blinkState = false;

unsigned long lastUpdateTime = 0;
int rainbowHue = 0;

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
  // Check for incoming serial data
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    parseCommand(command);
  }

  // Update LED state based on current mode
  unsigned long currentTime = millis();
  if (currentTime - lastUpdateTime >= blinkInterval) {
    lastUpdateTime = currentTime;
    updateLed();
  }
}

void parseCommand(String cmd) {
  if (cmd.equalsIgnoreCase("ON")) {
    currentMode = MODE_SOLID;
    color1 = pixels.Color(255, 255, 255);
    blinkInterval = 1000; // Not used, but set a default
  } else if (cmd.equalsIgnoreCase("OFF")) {
    currentMode = MODE_OFF;
  } else if (cmd.startsWith("COLOR")) {
    currentMode = MODE_SOLID;
    int r, g, b;
    sscanf(cmd.c_str(), "COLOR,%d,%d,%d", &r, &g, &b);
    color1 = pixels.Color(r, g, b);
  } else if (cmd.startsWith("BLINK1")) {
    currentMode = MODE_BLINK1;
    int r, g, b, interval;
    sscanf(cmd.c_str(), "BLINK1,%d,%d,%d,%d", &r, &g, &b, &interval);
    color1 = pixels.Color(r, g, b);
    blinkInterval = interval;
  } else if (cmd.startsWith("BLINK2")) {
    currentMode = MODE_BLINK2;
    int r1, g1, b1, r2, g2, b2, interval;
    sscanf(cmd.c_str(), "BLINK2,%d,%d,%d,%d,%d,%d,%d", &r1, &g1, &b1, &r2, &g2, &b2, &interval);
    color1 = pixels.Color(r1, g1, b1);
    color2 = pixels.Color(r2, g2, b2);
    blinkInterval = interval;
  } else if (cmd.startsWith("RAINBOW")) {
    currentMode = MODE_RAINBOW;
    int interval;
    sscanf(cmd.c_str(), "RAINBOW,%d", &interval);
    blinkInterval = interval > 0 ? interval : 20; // Interval is delay between hue shifts
  }
  updateLed(); // Update immediately on new command
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
