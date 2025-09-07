#ifndef COMMAND_PROCESSOR_H
#define COMMAND_PROCESSOR_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Command processing results
typedef enum {
    COMMAND_ACCEPTED,
    COMMAND_REJECTED,
    COMMAND_UNKNOWN
} CommandResult;

// Response structure for command processing
typedef struct {
    CommandResult result;
    char response[128];  // Response string buffer
} CommandResponse;

// Pure C functions for command parsing and validation
bool parseColorCommand(const char* cmd, uint8_t* r, uint8_t* g, uint8_t* b);
bool parseBlink1Command(const char* cmd, uint8_t* r, uint8_t* g, uint8_t* b, long* interval);
bool parseBlink2Command(const char* cmd, uint8_t* r1, uint8_t* g1, uint8_t* b1, 
                       uint8_t* r2, uint8_t* g2, uint8_t* b2, long* interval);
bool parseRainbowCommand(const char* cmd, long* interval);

// Command processing and response generation
void processCommand(const char* cmd, CommandResponse* response);
void generateAcceptedResponse(const char* command, const char* additional, CommandResponse* response);
void generateRejectedResponse(const char* command, const char* reason, CommandResponse* response);

#ifdef __cplusplus
}
#endif

#endif // COMMAND_PROCESSOR_H