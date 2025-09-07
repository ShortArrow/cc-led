#include "NeoPixelLEDController.h"

NeoPixelLEDController::NeoPixelLEDController(int dataPin, int powerPin, int ledCount, int brightness)
  : pixels(ledCount, dataPin, NEO_GRB + NEO_KHZ800), powerPin(powerPin), 
    animationMode(NONE), blinkState(false), rainbowHue(0) {
  pixels.setBrightness(brightness);
}

void NeoPixelLEDController::initialize() {
  if (powerPin >= 0) {
    pinMode(powerPin, OUTPUT);
    digitalWrite(powerPin, HIGH);
  }
  
  pixels.begin();
  pixels.clear();
  pixels.show();
  
  animationEnabled = false;
  animationMode = NONE;
}

void NeoPixelLEDController::update() {
  if (!animationEnabled) return;
  
  unsigned long currentMillis = millis();
  if (currentMillis - previousUpdateMillis < currentInterval) return;
  
  previousUpdateMillis = currentMillis;
  
  switch (animationMode) {
    case BLINK1:
      blinkState = !blinkState;
      pixels.setPixelColor(0, blinkState ? color1 : 0);
      showPixels();
      break;
      
    case BLINK2:
      blinkState = !blinkState;
      pixels.setPixelColor(0, blinkState ? color1 : color2);
      showPixels();
      break;
      
    case RAINBOW:
      pixels.setPixelColor(0, pixels.gamma32(pixels.ColorHSV(rainbowHue)));
      showPixels();
      rainbowHue += 256; // Increment hue
      if (rainbowHue > 65535) rainbowHue = 0;
      break;
      
    default:
      break;
  }
}

void NeoPixelLEDController::turnOn() {
  stopAnimation();
  setColor(255, 255, 255);
}

void NeoPixelLEDController::turnOff() {
  stopAnimation();
  pixels.clear();
  showPixels();
}

void NeoPixelLEDController::setColor(uint8_t r, uint8_t g, uint8_t b) {
  stopAnimation();
  pixels.setPixelColor(0, createColor(r, g, b));
  showPixels();
}

void NeoPixelLEDController::startBlink(uint8_t r, uint8_t g, uint8_t b, long interval) {
  currentInterval = interval;
  color1 = createColor(r, g, b);
  animationMode = BLINK1;
  animationEnabled = true;
  blinkState = false;
  previousUpdateMillis = millis();
  
  pixels.setPixelColor(0, 0); // Start with LED off
  showPixels();
}

void NeoPixelLEDController::startBlink2(uint8_t r1, uint8_t g1, uint8_t b1, 
                                       uint8_t r2, uint8_t g2, uint8_t b2, long interval) {
  currentInterval = interval;
  color1 = createColor(r1, g1, b1);
  color2 = createColor(r2, g2, b2);
  animationMode = BLINK2;
  animationEnabled = true;
  blinkState = false;
  previousUpdateMillis = millis();
  
  pixels.setPixelColor(0, color1); // Start with first color
  showPixels();
}

void NeoPixelLEDController::startRainbow(long interval) {
  currentInterval = interval;
  animationMode = RAINBOW;
  animationEnabled = true;
  rainbowHue = 0;
  previousUpdateMillis = millis();
}

void NeoPixelLEDController::stopAnimation() {
  animationEnabled = false;
  animationMode = NONE;
}

void NeoPixelLEDController::showPixels() {
  pixels.show();
}

uint32_t NeoPixelLEDController::createColor(uint8_t r, uint8_t g, uint8_t b) {
  return pixels.Color(r, g, b);
}