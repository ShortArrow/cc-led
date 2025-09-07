#include "DigitalLEDController.h"

DigitalLEDController::DigitalLEDController(int ledPin) 
  : pin(ledPin), currentState(LOW), blinkEnabled(false), blinkState(false) {
}

void DigitalLEDController::initialize() {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  animationEnabled = false;
}

void DigitalLEDController::update() {
  if (!animationEnabled) return;
  
  unsigned long currentMillis = millis();
  if (currentMillis - previousUpdateMillis >= currentInterval) {
    previousUpdateMillis = currentMillis;
    blinkState = !blinkState;
    setLEDState(blinkState ? HIGH : LOW);
  }
}

void DigitalLEDController::turnOn() {
  stopAnimation();
  setLEDState(HIGH);
}

void DigitalLEDController::turnOff() {
  stopAnimation();
  setLEDState(LOW);
}

void DigitalLEDController::setColor(uint8_t r, uint8_t g, uint8_t b) {
  // Digital LEDs ignore color - just turn on
  stopAnimation();
  setLEDState(HIGH);
}

void DigitalLEDController::startBlink(uint8_t r, uint8_t g, uint8_t b, long interval) {
  currentInterval = interval;
  animationEnabled = true;
  blinkState = false;
  previousUpdateMillis = millis();
  setLEDState(LOW); // Start with LED off
}

void DigitalLEDController::startBlink2(uint8_t r1, uint8_t g1, uint8_t b1, 
                                      uint8_t r2, uint8_t g2, uint8_t b2, long interval) {
  // Not supported - fall back to single blink
  startBlink(r1, g1, b1, interval);
}

void DigitalLEDController::startRainbow(long interval) {
  // Not supported - turn on solid
  turnOn();
}

void DigitalLEDController::stopAnimation() {
  animationEnabled = false;
}

void DigitalLEDController::setLEDState(int state) {
  currentState = state;
  digitalWrite(pin, state);
}