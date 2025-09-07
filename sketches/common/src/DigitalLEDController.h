#ifndef DIGITAL_LED_CONTROLLER_H
#define DIGITAL_LED_CONTROLLER_H

#include "LEDController.h"

/**
 * Digital LED Controller for simple on/off LEDs (Arduino Uno R4, Pi Pico, etc.)
 * Supports basic on/off and single-color blinking
 */
class DigitalLEDController : public LEDController {
public:
  DigitalLEDController(int ledPin);
  
  // Lifecycle
  void initialize() override;
  void update() override;
  
  // Basic control
  void turnOn() override;
  void turnOff() override;
  
  // Color control (ignored - always white for digital LEDs)
  void setColor(uint8_t r, uint8_t g, uint8_t b) override;
  
  // Animation control
  void startBlink(uint8_t r, uint8_t g, uint8_t b, long interval) override;
  void startBlink2(uint8_t r1, uint8_t g1, uint8_t b1, 
                  uint8_t r2, uint8_t g2, uint8_t b2, long interval) override;
  void startRainbow(long interval) override;
  void stopAnimation() override;
  
  // Capabilities
  bool supportsColor() const override { return false; }
  bool supportsRainbow() const override { return false; }
  bool supportsBlink2() const override { return false; }
  const char* getLEDType() const override { return "Digital"; }

private:
  int pin;
  int currentState;
  bool blinkEnabled;
  bool blinkState;
  
  void setLEDState(int state);
};

#endif // DIGITAL_LED_CONTROLLER_H