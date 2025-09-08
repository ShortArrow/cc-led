#ifndef UNIVERSAL_MAIN_H
#define UNIVERSAL_MAIN_H

#include "LEDController.h"
#include "SerialCommandHandler.h"

/**
 * Universal main loop for all board types
 * Each board only needs to implement createLEDController() function
 */

extern LEDController* createLEDController();

// Global instances (defined in UniversalMain.cpp)
extern SerialCommandHandler* commandHandler;
extern LEDController* ledController;

void universalSetup();
void universalLoop();

#endif // UNIVERSAL_MAIN_H