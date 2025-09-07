/**
 * Universal LED Control Sketch for Raspberry Pi Pico
 * Uses common architecture for multi-board support
 */

#include <LEDController.h>
#include <DigitalLEDController.h>
#include <SerialCommandHandler.h>
#include <UniversalMain.h>

// Raspberry Pi Pico specific pins
#define LED_PIN  25  // Built-in LED on GPIO pin 25

/**
 * Board-specific LED controller factory function
 * This is the only function each board needs to implement
 */
LEDController* createLEDController() {
  return new DigitalLEDController(LED_PIN);
}

void setup() {
  universalSetup();
}

void loop() {
  universalLoop();
}