const int ledPin = LED_BUILTIN; // Pin 13 builtin LED

// LED state management (non-blocking)
bool blinkEnabled = false;
unsigned long previousBlinkMillis = 0;
long blinkInterval = 500;
int ledState = LOW;

// Serial command buffer (non-blocking)
String serialBuffer = "";
bool commandReady = false;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  digitalWrite(ledPin, LOW);
}

void loop() {
  // Handle serial communication (non-blocking)
  handleSerial();
  
  // Handle LED blinking (non-blocking)  
  handleLED();
  
  // Process pending commands (non-blocking)
  if (commandReady) {
    processCommand(serialBuffer);
    serialBuffer = "";
    commandReady = false;
  }
}

void handleSerial() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n') {
      serialBuffer.trim();
      commandReady = true;
      return; // Process one command per loop cycle
    } else {
      serialBuffer += c;
    }
  }
}

void handleLED() {
  if (blinkEnabled) {
    unsigned long currentMillis = millis();
    if (currentMillis - previousBlinkMillis >= blinkInterval) {
      previousBlinkMillis = currentMillis;
      ledState = (ledState == LOW) ? HIGH : LOW;
      digitalWrite(ledPin, ledState);
    }
  }
}

void processCommand(String command) {
  if (command == "ON") {
    blinkEnabled = false;
    digitalWrite(ledPin, HIGH);
    Serial.println("ACCEPTED,ON");
  }
  else if (command == "OFF") {
    blinkEnabled = false;
    digitalWrite(ledPin, LOW);
    Serial.println("ACCEPTED,OFF");
  }
  else if (command.startsWith("COLOR,")) {
    blinkEnabled = false;
    digitalWrite(ledPin, HIGH);
    Serial.println("ACCEPTED," + command);
  }
  else if (command.startsWith("BLINK1,")) {
    // Parse: BLINK1,R,G,B,interval
    long newInterval = parseInterval(command, 4);
    if (newInterval > 0) {
      blinkInterval = newInterval;
      blinkEnabled = true;
      ledState = LOW;
      previousBlinkMillis = millis();
      Serial.println("ACCEPTED," + command + ",interval=" + String(blinkInterval));
    } else {
      Serial.println("REJECT," + command + ",invalid interval");
    }
  }
  else if (command.startsWith("BLINK2,")) {
    // Parse: BLINK2,R1,G1,B1,R2,G2,B2,interval  
    long newInterval = parseInterval(command, 7);
    if (newInterval > 0) {
      blinkInterval = newInterval;
      blinkEnabled = true;
      ledState = LOW;
      previousBlinkMillis = millis();
      Serial.println("ACCEPTED," + command + ",interval=" + String(blinkInterval));
    } else {
      Serial.println("REJECT," + command + ",invalid interval");
    }
  }
  else if (command.startsWith("RAINBOW,")) {
    // Parse: RAINBOW,interval
    int commaIndex = command.indexOf(',');
    if (commaIndex > 0) {
      long newInterval = command.substring(commaIndex + 1).toInt();
      if (newInterval > 0) {
        blinkInterval = newInterval;
        blinkEnabled = true;
        ledState = LOW;
        previousBlinkMillis = millis();
        Serial.println("ACCEPTED," + command + ",interval=" + String(blinkInterval));
      } else {
        Serial.println("REJECT," + command + ",invalid interval");
      }
    } else {
      Serial.println("REJECT," + command + ",missing interval");
    }
  }
  else {
    Serial.println("REJECT," + command + ",unknown command");
  }
}

long parseInterval(String command, int expectedCommas) {
  int commaCount = 0;
  for (int i = 0; i < command.length(); i++) {
    if (command.charAt(i) == ',') {
      commaCount++;
      if (commaCount == expectedCommas) {
        return command.substring(i + 1).toInt();
      }
    }
  }
  return -1; // Invalid
}