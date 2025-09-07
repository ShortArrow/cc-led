#ifndef SERIAL_COMMAND_HANDLER_H
#define SERIAL_COMMAND_HANDLER_H

#include <Arduino.h>
#include "LEDController.h"
#include "CommandProcessor.h"

/**
 * Common serial command handling for all board types
 * Handles non-blocking serial input, command parsing, and response generation
 */
class SerialCommandHandler {
public:
  SerialCommandHandler(LEDController* ledController);
  
  void initialize(long baudRate = 9600);
  void handleSerial();  // Non-blocking serial input processing
  void processCommands();  // Process complete commands

private:
  LEDController* led;
  
  // Non-blocking serial buffer
  String serialBuffer;
  bool commandReady;
  
  // Command processing
  void processCommand(const String& cmd);
  void sendResponse(const String& status, const String& command, const String& additional = "");
  
  // CommandProcessor integration (C functions used directly)
  
  // Response helpers
  void sendAccepted(const String& command, const String& additional = "");
  void sendRejected(const String& command, const String& reason);
};

#endif // SERIAL_COMMAND_HANDLER_H