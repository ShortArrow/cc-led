#ifndef LED_CONTROLLER_H
#define LED_CONTROLLER_H

#include <Arduino.h>

/**
 * Abstract base class for LED control across different board types
 * Provides unified interface for Digital LEDs, RGB LEDs, Matrix displays etc.
 */
class LEDController {
public:
  virtual ~LEDController() {}

  // === Lifecycle Methods ===
  virtual void initialize() = 0;
  virtual void update() = 0;  // Non-blocking update, called in loop()

  // === Basic Control ===
  virtual void turnOn() = 0;
  virtual void turnOff() = 0;

  // === Color Control ===
  virtual void setColor(uint8_t r, uint8_t g, uint8_t b) = 0;

  // === Animation Control ===
  virtual void startBlink(uint8_t r, uint8_t g, uint8_t b, long interval) = 0;
  virtual void startBlink2(uint8_t r1, uint8_t g1, uint8_t b1, 
                          uint8_t r2, uint8_t g2, uint8_t b2, long interval) = 0;
  virtual void startRainbow(long interval) = 0;
  virtual void stopAnimation() = 0;

  // === Capability Detection ===
  virtual bool supportsColor() const = 0;
  virtual bool supportsRainbow() const = 0;
  virtual bool supportsBlink2() const = 0;
  virtual const char* getLEDType() const = 0;  // "Digital", "RGB", "Matrix", etc.

protected:
  // Common timing variables that derived classes can use
  unsigned long previousUpdateMillis = 0;
  long currentInterval = 500;
  bool animationEnabled = false;
};

#endif // LED_CONTROLLER_H