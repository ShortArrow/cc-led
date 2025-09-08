#include "SerialCommandHandler.h"

extern "C" {
  #include "CommandProcessor.h"
}

SerialCommandHandler::SerialCommandHandler(LEDController* ledController) 
  : led(ledController), commandReady(false) {
}

void SerialCommandHandler::initialize(long baudRate) {
  // Serial already initialized in universalSetup
  serialBuffer.reserve(64);  // Pre-allocate buffer space
}

void SerialCommandHandler::handleSerial() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n') {
      if (serialBuffer.length() > 0) {
        serialBuffer.trim();
        commandReady = true;
        return; // Process one command per loop cycle
      }
    } else {
      // Add all non-newline characters to buffer (including \r)
      serialBuffer += c;
      if (serialBuffer.length() > 60) { // Prevent buffer overflow
        serialBuffer = "";
        sendRejected("BUFFER_OVERFLOW", "command too long");
      }
    }
  }
}

void SerialCommandHandler::processCommands() {
  if (commandReady) {
    processCommand(serialBuffer);
    serialBuffer = "";
    commandReady = false;
  }
}

void SerialCommandHandler::processCommand(const String& cmd) {
  // Use CommandProcessor for parsing and response generation
  CommandResponse response;
  ::processCommand(cmd.c_str(), &response);  // Call global C function
  
  // Execute LED actions based on successful parsing
  if (response.result == COMMAND_ACCEPTED) {
    if (cmd == "ON") {
      led->turnOn();
    }
    else if (cmd == "OFF") {
      led->turnOff();
    }
    else if (cmd.startsWith("COLOR,")) {
      uint8_t r, g, b;
      if (parseColorCommand(cmd.c_str(), &r, &g, &b)) {
        led->setColor(r, g, b);
      }
    }
    else if (cmd.startsWith("BLINK1,")) {
      uint8_t r, g, b;
      long interval;
      if (parseBlink1Command(cmd.c_str(), &r, &g, &b, &interval)) {
        led->startBlink(r, g, b, interval);
      }
    }
    else if (cmd.startsWith("BLINK2,")) {
      uint8_t r1, g1, b1, r2, g2, b2;
      long interval;
      if (parseBlink2Command(cmd.c_str(), &r1, &g1, &b1, &r2, &g2, &b2, &interval)) {
        led->startBlink2(r1, g1, b1, r2, g2, b2, interval);
      }
    }
    else if (cmd.startsWith("RAINBOW,")) {
      long interval;
      if (parseRainbowCommand(cmd.c_str(), &interval)) {
        led->startRainbow(interval);
      }
    }
  }
  
  // Send response using CommandProcessor output
  Serial.println(response.response);
  Serial.flush();
}

// Parser functions now handled by CommandProcessor.c

void SerialCommandHandler::sendAccepted(const String& command, const String& additional) {
  sendResponse("ACCEPTED", command, additional);
}

void SerialCommandHandler::sendRejected(const String& command, const String& reason) {
  sendResponse("REJECT", command, reason);
}

void SerialCommandHandler::sendResponse(const String& status, const String& command, const String& additional) {
  Serial.print(status);
  Serial.print(",");
  Serial.print(command);
  if (additional.length() > 0) {
    Serial.print(",");
    Serial.print(additional);
  }
  Serial.println();
  Serial.flush(); // Ensure immediate transmission
}