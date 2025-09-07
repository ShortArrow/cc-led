#include "UniversalMain.h"

// Global instances
SerialCommandHandler* commandHandler = nullptr;
LEDController* ledController = nullptr;

void universalSetup() {
  // Initialize serial communication first
  Serial.begin(9600);
  
  // Create board-specific LED controller
  ledController = createLEDController();
  
  // Initialize LED controller
  ledController->initialize();
  
  // Create command handler
  commandHandler = new SerialCommandHandler(ledController);
}

void universalLoop() {
  // Handle non-blocking serial communication
  commandHandler->handleSerial();
  
  // Update LED animations (non-blocking)
  ledController->update();
  
  // Process completed commands
  commandHandler->processCommands();
}