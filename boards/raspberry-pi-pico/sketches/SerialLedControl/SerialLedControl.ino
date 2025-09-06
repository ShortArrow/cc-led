/**
 * SerialLedControl for Raspberry Pi Pico
 * Controls the built-in LED on GPIO pin 25
 * Supports: ON, OFF, BLINK commands
 */

const int LED_PIN = 25;  // Built-in LED on Raspberry Pi Pico

// Blink state
bool isBlinking = false;
unsigned long blinkInterval = 500;
unsigned long lastBlinkTime = 0;
bool ledState = false;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  Serial.begin(9600);
  while (!Serial) {
    delay(10);  // Wait for serial connection
  }
  
  // Send ready signal
  Serial.println("READY");
}

void loop() {
  // Handle serial commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    processCommand(command);
  }
  
  // Handle blinking
  if (isBlinking) {
    unsigned long currentTime = millis();
    if (currentTime - lastBlinkTime >= blinkInterval) {
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState ? HIGH : LOW);
      lastBlinkTime = currentTime;
    }
  }
}

void processCommand(String command) {
  if (command == "ON") {
    isBlinking = false;
    digitalWrite(LED_PIN, HIGH);
    Serial.println("ACCEPTED,ON");
  }
  else if (command == "OFF") {
    isBlinking = false;
    digitalWrite(LED_PIN, LOW);
    Serial.println("ACCEPTED,OFF");
  }
  else if (command.startsWith("COLOR,")) {
    // Digital LED doesn't support colors, but treat as ON
    isBlinking = false;
    digitalWrite(LED_PIN, HIGH);
    Serial.println("ACCEPTED," + command);
  }
  else if (command.startsWith("BLINK1,")) {
    // Parse interval from command
    int lastComma = command.lastIndexOf(',');
    if (lastComma > 0) {
      String intervalStr = command.substring(lastComma + 1);
      blinkInterval = intervalStr.toInt();
      if (blinkInterval < 1) blinkInterval = 500;  // Default fallback
    }
    
    isBlinking = true;
    ledState = false;
    lastBlinkTime = millis();
    Serial.print("ACCEPTED,");
    Serial.print(command.substring(0, lastComma + 1));
    Serial.print("interval=");
    Serial.println(blinkInterval);
  }
  else if (command.startsWith("BLINK2,")) {
    // Two-color blink not supported, fallback to single blink
    int lastComma = command.lastIndexOf(',');
    if (lastComma > 0) {
      String intervalStr = command.substring(lastComma + 1);
      blinkInterval = intervalStr.toInt();
      if (blinkInterval < 1) blinkInterval = 500;
    }
    
    isBlinking = true;
    ledState = false;
    lastBlinkTime = millis();
    Serial.print("ACCEPTED,");
    Serial.print(command.substring(0, lastComma + 1));
    Serial.print("interval=");
    Serial.println(blinkInterval);
  }
  else if (command.startsWith("RAINBOW,")) {
    // Rainbow not supported, fallback to blink
    int commaPos = command.indexOf(',');
    if (commaPos > 0) {
      String intervalStr = command.substring(commaPos + 1);
      blinkInterval = intervalStr.toInt();
      if (blinkInterval < 1) blinkInterval = 50;
    }
    
    isBlinking = true;
    ledState = false;
    lastBlinkTime = millis();
    Serial.print("ACCEPTED,RAINBOW,interval=");
    Serial.println(blinkInterval);
  }
  else {
    Serial.println("REJECT,UNKNOWN_COMMAND");
  }
}