#include "SerialCommandHandler.h"

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
  if (cmd == "ON") {
    led->turnOn();
    Serial.println("ACCEPTED,ON");
    Serial.flush();
  }
  else if (cmd == "OFF") {
    led->turnOff();
    Serial.println("ACCEPTED,OFF");
    Serial.flush();
  }
  else if (cmd.startsWith("COLOR,")) {
    uint8_t r, g, b;
    if (parseColorCommand(cmd, r, g, b)) {
      led->setColor(r, g, b);
      Serial.println("ACCEPTED," + cmd);
      Serial.flush();
    } else {
      Serial.println("REJECT," + cmd + ",invalid format");
      Serial.flush();
    }
  }
  else if (cmd.startsWith("BLINK1,")) {
    uint8_t r, g, b;
    long interval;
    if (parseBlink1Command(cmd, r, g, b, interval)) {
      led->startBlink(r, g, b, interval);
      Serial.println("ACCEPTED,BLINK1," + String(r) + "," + String(g) + "," + String(b) + ",interval=" + String(interval));
      Serial.flush();
    } else {
      Serial.println("REJECT," + cmd + ",invalid parameters");
      Serial.flush();
    }
  }
  else if (cmd.startsWith("BLINK2,")) {
    uint8_t r1, g1, b1, r2, g2, b2;
    long interval;
    if (parseBlink2Command(cmd, r1, g1, b1, r2, g2, b2, interval)) {
      led->startBlink2(r1, g1, b1, r2, g2, b2, interval);
      Serial.println("ACCEPTED,BLINK2," + String(r1) + "," + String(g1) + "," + String(b1) + "," + 
                     String(r2) + "," + String(g2) + "," + String(b2) + ",interval=" + String(interval));
      Serial.flush();
    } else {
      Serial.println("REJECT," + cmd + ",invalid parameters");
      Serial.flush();
    }
  }
  else if (cmd.startsWith("RAINBOW,")) {
    long interval;
    if (parseRainbowCommand(cmd, interval)) {
      led->startRainbow(interval);
      Serial.println("ACCEPTED,RAINBOW,interval=" + String(interval));
      Serial.flush();
    } else {
      Serial.println("REJECT," + cmd + ",invalid interval");
      Serial.flush();
    }
  }
  else {
    Serial.println("REJECT," + cmd + ",unknown command");
    Serial.flush();
  }
}

bool SerialCommandHandler::parseColorCommand(const String& cmd, uint8_t& r, uint8_t& g, uint8_t& b) {
  // Manual parsing for Arduino compatibility
  if (!cmd.startsWith("COLOR,")) return false;
  
  String params = cmd.substring(6); // Skip "COLOR,"
  int commaIndex1 = params.indexOf(',');
  if (commaIndex1 == -1) return false;
  
  int commaIndex2 = params.indexOf(',', commaIndex1 + 1);
  if (commaIndex2 == -1) return false;
  
  // Parse RGB values
  r = params.substring(0, commaIndex1).toInt();
  g = params.substring(commaIndex1 + 1, commaIndex2).toInt();
  b = params.substring(commaIndex2 + 1).toInt();
  
  return (r <= 255 && g <= 255 && b <= 255);
}

bool SerialCommandHandler::parseBlink1Command(const String& cmd, uint8_t& r, uint8_t& g, uint8_t& b, long& interval) {
  // Manual parsing for Arduino compatibility
  if (!cmd.startsWith("BLINK1,")) return false;
  
  String params = cmd.substring(7); // Skip "BLINK1,"
  int commaIndex1 = params.indexOf(',');
  if (commaIndex1 == -1) return false;
  
  int commaIndex2 = params.indexOf(',', commaIndex1 + 1);
  if (commaIndex2 == -1) return false;
  
  int commaIndex3 = params.indexOf(',', commaIndex2 + 1);
  if (commaIndex3 == -1) return false;
  
  // Parse each component
  r = params.substring(0, commaIndex1).toInt();
  g = params.substring(commaIndex1 + 1, commaIndex2).toInt();
  b = params.substring(commaIndex2 + 1, commaIndex3).toInt();
  interval = params.substring(commaIndex3 + 1).toInt();
  
  return (r <= 255 && g <= 255 && b <= 255 && interval > 0);
}

bool SerialCommandHandler::parseBlink2Command(const String& cmd, uint8_t& r1, uint8_t& g1, uint8_t& b1,
                                            uint8_t& r2, uint8_t& g2, uint8_t& b2, long& interval) {
  int temp_interval;
  bool result = sscanf(cmd.c_str(), "BLINK2,%hhu,%hhu,%hhu,%hhu,%hhu,%hhu,%d", 
                &r1, &g1, &b1, &r2, &g2, &b2, &temp_interval) == 7 && temp_interval > 0;
  if (result) {
    interval = temp_interval;
  }
  return result;
}

bool SerialCommandHandler::parseRainbowCommand(const String& cmd, long& interval) {
  int temp_interval;
  bool result = sscanf(cmd.c_str(), "RAINBOW,%d", &temp_interval) == 1 && temp_interval > 0;
  if (result) {
    interval = temp_interval;
  }
  return result;
}

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