#ifndef NEOPIXEL_LED_CONTROLLER_H
#define NEOPIXEL_LED_CONTROLLER_H

#include "LEDController.h"
#include <Adafruit_NeoPixel.h>

/**
 * NeoPixel LED Controller for RGB LEDs (XIAO RP2040, ESP32 with WS2812, etc.)
 * Supports full RGB color control, animations, and rainbow effects
 */
class NeoPixelLEDController : public LEDController {
public:
  NeoPixelLEDController(int dataPin, int powerPin = -1, int ledCount = 1, int brightness = 128);
  
  // Lifecycle
  void initialize() override;
  void update() override;
  
  // Basic control
  void turnOn() override;
  void turnOff() override;
  
  // Color control
  void setColor(uint8_t r, uint8_t g, uint8_t b) override;
  
  // Animation control
  void startBlink(uint8_t r, uint8_t g, uint8_t b, long interval) override;
  void startBlink2(uint8_t r1, uint8_t g1, uint8_t b1, 
                  uint8_t r2, uint8_t g2, uint8_t b2, long interval) override;
  void startRainbow(long interval) override;
  void stopAnimation() override;
  
  // Capabilities
  bool supportsColor() const override { return true; }
  bool supportsRainbow() const override { return true; }
  bool supportsBlink2() const override { return true; }
  const char* getLEDType() const override { return "RGB"; }

private:
  Adafruit_NeoPixel pixels;
  int powerPin;
  
  enum AnimationMode { NONE, BLINK1, BLINK2, RAINBOW };
  AnimationMode animationMode;
  
  // Animation state
  uint32_t color1, color2;
  bool blinkState;
  int rainbowHue;
  
  // Helper methods
  void showPixels();
  uint32_t createColor(uint8_t r, uint8_t g, uint8_t b);
};

#endif // NEOPIXEL_LED_CONTROLLER_H