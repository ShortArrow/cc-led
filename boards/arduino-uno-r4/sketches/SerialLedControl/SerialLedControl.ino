const int ledPin = LED_BUILTIN; // Pin 13 builtin LED
bool blinkEnabled = false;

unsigned long previousMillis = 0;
const long blinkInterval = 500; // Default blink interval in milliseconds
int ledState = LOW;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  digitalWrite(ledPin, LOW); // Start with LED off
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "ON") {
      blinkEnabled = false;
      digitalWrite(ledPin, HIGH);
      Serial.println("LED ON");
    } 
    else if (command == "OFF") {
      blinkEnabled = false;
      digitalWrite(ledPin, LOW);
      Serial.println("LED OFF");
    }
    else if (command == "BLINK") {
      blinkEnabled = true;
      ledState = LOW;  // Start with LED off
      previousMillis = millis(); // Reset timer when blink starts
      Serial.println("LED BLINK");
    }
  }

  // Handle blinking
  if (blinkEnabled) {
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillis >= blinkInterval) {
      previousMillis = currentMillis;
      // Toggle the LED state
      ledState = (ledState == LOW) ? HIGH : LOW;
      digitalWrite(ledPin, ledState);
    }
  }
}