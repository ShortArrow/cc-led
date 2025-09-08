#include "CommandProcessor.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

bool parseColorCommand(const char* cmd, uint8_t* r, uint8_t* g, uint8_t* b) {
    if (!cmd || strncmp(cmd, "COLOR,", 6) != 0) {
        return false;
    }
    
    const char* params = cmd + 6; // Skip "COLOR,"
    
    // Find comma positions
    const char* comma1 = strchr(params, ',');
    if (!comma1) return false;
    
    const char* comma2 = strchr(comma1 + 1, ',');
    if (!comma2) return false;
    
    // Check for extra parameters
    if (strchr(comma2 + 1, ',') != NULL) return false;
    
    // Parse RGB values
    int r_val = atoi(params);
    int g_val = atoi(comma1 + 1);
    int b_val = atoi(comma2 + 1);
    
    // Validate bounds (0-255) and negative detection
    if (r_val < 0 || r_val > 255 || g_val < 0 || g_val > 255 || b_val < 0 || b_val > 255) {
        return false;
    }
    
    // Additional check for negative strings (atoi returns 0 for invalid input)
    if ((r_val == 0 && params[0] == '-') ||
        (g_val == 0 && (comma1 + 1)[0] == '-') ||
        (b_val == 0 && (comma2 + 1)[0] == '-')) {
        return false;
    }
    
    *r = (uint8_t)r_val;
    *g = (uint8_t)g_val;
    *b = (uint8_t)b_val;
    
    return true;
}

bool parseBlink1Command(const char* cmd, uint8_t* r, uint8_t* g, uint8_t* b, long* interval) {
    if (!cmd || strncmp(cmd, "BLINK1,", 7) != 0) {
        return false;
    }
    
    const char* params = cmd + 7; // Skip "BLINK1,"
    
    // Find comma positions
    const char* comma1 = strchr(params, ',');
    if (!comma1) return false;
    
    const char* comma2 = strchr(comma1 + 1, ',');
    if (!comma2) return false;
    
    const char* comma3 = strchr(comma2 + 1, ',');
    if (!comma3) return false;
    
    // Check for extra parameters
    if (strchr(comma3 + 1, ',') != NULL) return false;
    
    // Parse values
    int r_val = atoi(params);
    int g_val = atoi(comma1 + 1);
    int b_val = atoi(comma2 + 1);
    long interval_val = atol(comma3 + 1);
    
    // Validate RGB bounds and interval > 0
    if (r_val < 0 || r_val > 255 || g_val < 0 || g_val > 255 || 
        b_val < 0 || b_val > 255 || interval_val <= 0) {
        return false;
    }
    
    *r = (uint8_t)r_val;
    *g = (uint8_t)g_val;
    *b = (uint8_t)b_val;
    *interval = interval_val;
    
    return true;
}

bool parseBlink2Command(const char* cmd, uint8_t* r1, uint8_t* g1, uint8_t* b1,
                       uint8_t* r2, uint8_t* g2, uint8_t* b2, long* interval) {
    if (!cmd || strncmp(cmd, "BLINK2,", 7) != 0) {
        return false;
    }
    
    int temp_r1, temp_g1, temp_b1, temp_r2, temp_g2, temp_b2, temp_interval;
    int result = sscanf(cmd, "BLINK2,%d,%d,%d,%d,%d,%d,%d", 
                       &temp_r1, &temp_g1, &temp_b1, &temp_r2, &temp_g2, &temp_b2, &temp_interval);
    
    if (result == 7 && temp_interval > 0 && 
        temp_r1 >= 0 && temp_r1 <= 255 && temp_g1 >= 0 && temp_g1 <= 255 && temp_b1 >= 0 && temp_b1 <= 255 &&
        temp_r2 >= 0 && temp_r2 <= 255 && temp_g2 >= 0 && temp_g2 <= 255 && temp_b2 >= 0 && temp_b2 <= 255) {
        *r1 = (uint8_t)temp_r1;
        *g1 = (uint8_t)temp_g1;
        *b1 = (uint8_t)temp_b1;
        *r2 = (uint8_t)temp_r2;
        *g2 = (uint8_t)temp_g2;
        *b2 = (uint8_t)temp_b2;
        *interval = temp_interval;
        return true;
    }
    
    return false;
}

bool parseRainbowCommand(const char* cmd, long* interval) {
    if (!cmd) return false;
    
    int temp_interval;
    int result = sscanf(cmd, "RAINBOW,%d", &temp_interval);
    
    if (result == 1 && temp_interval > 0) {
        *interval = temp_interval;
        return true;
    }
    
    return false;
}

void processCommand(const char* cmd, CommandResponse* response) {
    if (!cmd || !response) {
        if (response) {
            response->result = COMMAND_REJECTED;
            strcpy(response->response, "REJECT,,unknown command");
        }
        return;
    }
    
    // Handle empty command
    if (strlen(cmd) == 0) {
        response->result = COMMAND_REJECTED;
        strcpy(response->response, "REJECT,,unknown command");
        return;
    }
    
    // Basic commands
    if (strcmp(cmd, "ON") == 0) {
        response->result = COMMAND_ACCEPTED;
        strcpy(response->response, "ACCEPTED,ON");
    }
    else if (strcmp(cmd, "OFF") == 0) {
        response->result = COMMAND_ACCEPTED;
        strcpy(response->response, "ACCEPTED,OFF");
    }
    // Color command
    else if (strncmp(cmd, "COLOR,", 6) == 0) {
        uint8_t r, g, b;
        if (parseColorCommand(cmd, &r, &g, &b)) {
            response->result = COMMAND_ACCEPTED;
            snprintf(response->response, sizeof(response->response), 
                    "ACCEPTED,%s", cmd);
        } else {
            response->result = COMMAND_REJECTED;
            snprintf(response->response, sizeof(response->response), 
                    "REJECT,%s,invalid format", cmd);
        }
    }
    // BLINK1 command
    else if (strncmp(cmd, "BLINK1,", 7) == 0) {
        uint8_t r, g, b;
        long interval;
        if (parseBlink1Command(cmd, &r, &g, &b, &interval)) {
            response->result = COMMAND_ACCEPTED;
            snprintf(response->response, sizeof(response->response), 
                    "ACCEPTED,BLINK1,%d,%d,%d,interval=%ld", r, g, b, interval);
        } else {
            response->result = COMMAND_REJECTED;
            snprintf(response->response, sizeof(response->response), 
                    "REJECT,%s,invalid parameters", cmd);
        }
    }
    // BLINK2 command
    else if (strncmp(cmd, "BLINK2,", 7) == 0) {
        uint8_t r1, g1, b1, r2, g2, b2;
        long interval;
        if (parseBlink2Command(cmd, &r1, &g1, &b1, &r2, &g2, &b2, &interval)) {
            response->result = COMMAND_ACCEPTED;
            snprintf(response->response, sizeof(response->response), 
                    "ACCEPTED,BLINK2,%d,%d,%d,%d,%d,%d,interval=%ld", 
                    r1, g1, b1, r2, g2, b2, interval);
        } else {
            response->result = COMMAND_REJECTED;
            snprintf(response->response, sizeof(response->response), 
                    "REJECT,%s,invalid parameters", cmd);
        }
    }
    // RAINBOW command
    else if (strncmp(cmd, "RAINBOW,", 8) == 0) {
        long interval;
        if (parseRainbowCommand(cmd, &interval)) {
            response->result = COMMAND_ACCEPTED;
            snprintf(response->response, sizeof(response->response), 
                    "ACCEPTED,RAINBOW,interval=%ld", interval);
        } else {
            response->result = COMMAND_REJECTED;
            snprintf(response->response, sizeof(response->response), 
                    "REJECT,%s,invalid interval", cmd);
        }
    }
    // Unknown command
    else {
        response->result = COMMAND_REJECTED;
        snprintf(response->response, sizeof(response->response), 
                "REJECT,%s,unknown command", cmd);
    }
}

void generateAcceptedResponse(const char* command, const char* additional, CommandResponse* response) {
    if (!response) return;
    
    response->result = COMMAND_ACCEPTED;
    if (additional && strlen(additional) > 0) {
        snprintf(response->response, sizeof(response->response), 
                "ACCEPTED,%s,%s", command ? command : "", additional);
    } else {
        snprintf(response->response, sizeof(response->response), 
                "ACCEPTED,%s", command ? command : "");
    }
}

void generateRejectedResponse(const char* command, const char* reason, CommandResponse* response) {
    if (!response) return;
    
    response->result = COMMAND_REJECTED;
    snprintf(response->response, sizeof(response->response), 
            "REJECT,%s,%s", command ? command : "", reason ? reason : "");
}