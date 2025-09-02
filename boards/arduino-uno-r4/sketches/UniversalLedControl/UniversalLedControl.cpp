/**
 * Universal LED Control Sketch for Arduino Uno R4
 * Uses common architecture for multi-board support
 */

#include <LEDController.h>
#include <DigitalLEDController.h>
#include <SerialCommandHandler.h>
#include <UniversalMain.h>

/**
 * Board-specific LED controller factory function
 * This is the only function each board needs to implement
 */
LEDController* createLEDController() {
  return new DigitalLEDController(LED_BUILTIN);
}

void setup() {
  universalSetup();
}

void loop() {
  universalLoop();
}