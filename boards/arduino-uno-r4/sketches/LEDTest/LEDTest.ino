// LED Test for Arduino Uno R4
// Simple test to verify LED_BUILTIN works

void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
  
  Serial.println("LED Test Started");
  Serial.print("LED_BUILTIN pin: ");
  Serial.println(LED_BUILTIN);
  
  // Test blink sequence
  for(int i = 0; i < 5; i++) {
    Serial.print("Blink ");
    Serial.println(i + 1);
    
    digitalWrite(LED_BUILTIN, HIGH);
    Serial.println("LED ON");
    delay(500);
    
    digitalWrite(LED_BUILTIN, LOW);
    Serial.println("LED OFF");
    delay(500);
  }
  
  Serial.println("Test complete - LED should now be OFF");
}

void loop() {
  // Test serial commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd == "ON") {
      digitalWrite(LED_BUILTIN, HIGH);
      Serial.println("ACCEPTED,ON");
      Serial.flush();
    } else if (cmd == "OFF") {
      digitalWrite(LED_BUILTIN, LOW);
      Serial.println("ACCEPTED,OFF");
      Serial.flush();
    } else {
      Serial.println("Commands: ON, OFF");
    }
  }
}