/**
 * Universal LED Control Sketch for XIAO RP2040
 * Uses common architecture for multi-board support
 */

#include <Adafruit_NeoPixel.h>
#include <LEDController.h>
#include <NeoPixelLEDController.h>
#include <SerialCommandHandler.h>
#include <UniversalMain.h>

// XIAO RP2040 specific pins
#define POWER_PIN   11
#define DIN_PIN     12
#define LED_COUNT   1
#define BRIGHTNESS  128

/**
 * Board-specific LED controller factory function
 * This is the only function each board needs to implement
 */
LEDController* createLEDController() {
  return new NeoPixelLEDController(DIN_PIN, POWER_PIN, LED_COUNT, BRIGHTNESS);
}

void setup() {
  universalSetup();
}

void loop() {
  universalLoop();
}