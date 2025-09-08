#include "unity.h"
#include "CommandProcessor.h"
#include <string.h>

// Test setup and teardown
void setUp(void) {
    // Set up before each test
}

void tearDown(void) {
    // Clean up after each test
}

// U1-001: Basic ON command processing
void test_U1_001_BasicOnCommand(void) {
    CommandResponse response;
    processCommand("ON", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_ACCEPTED, response.result);
    TEST_ASSERT_EQUAL_STRING("ACCEPTED,ON", response.response);
}

// U1-002: Basic OFF command processing
void test_U1_002_BasicOffCommand(void) {
    CommandResponse response;
    processCommand("OFF", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_ACCEPTED, response.result);
    TEST_ASSERT_EQUAL_STRING("ACCEPTED,OFF", response.response);
}

// U1-003: Valid RGB color processing
void test_U1_003_ValidColorCommand(void) {
    CommandResponse response;
    processCommand("COLOR,255,0,0", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_ACCEPTED, response.result);
    TEST_ASSERT_EQUAL_STRING("ACCEPTED,COLOR,255,0,0", response.response);
}

// U1-004: R channel boundary violation
void test_U1_004_RChannelBoundaryViolation(void) {
    CommandResponse response;
    processCommand("COLOR,256,0,0", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_REJECTED, response.result);
    TEST_ASSERT_EQUAL_STRING("REJECT,COLOR,256,0,0,invalid format", response.response);
}

// U1-005: G channel boundary violation
void test_U1_005_GChannelBoundaryViolation(void) {
    CommandResponse response;
    processCommand("COLOR,255,256,0", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_REJECTED, response.result);
    TEST_ASSERT_EQUAL_STRING("REJECT,COLOR,255,256,0,invalid format", response.response);
}

// U1-006: B channel boundary violation
void test_U1_006_BChannelBoundaryViolation(void) {
    CommandResponse response;
    processCommand("COLOR,255,0,256", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_REJECTED, response.result);
    TEST_ASSERT_EQUAL_STRING("REJECT,COLOR,255,0,256,invalid format", response.response);
}

// U1-007: Negative R channel
void test_U1_007_NegativeRChannel(void) {
    CommandResponse response;
    processCommand("COLOR,-1,0,0", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_REJECTED, response.result);
    TEST_ASSERT_EQUAL_STRING("REJECT,COLOR,-1,0,0,invalid format", response.response);
}

// U1-008: Missing B channel
void test_U1_008_MissingBChannel(void) {
    CommandResponse response;
    processCommand("COLOR,255,0", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_REJECTED, response.result);
    TEST_ASSERT_EQUAL_STRING("REJECT,COLOR,255,0,invalid format", response.response);
}

// U1-009: Extra parameters in COLOR command
void test_U1_009_ExtraParametersColor(void) {
    CommandResponse response;
    processCommand("COLOR,255,0,0,extra", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_REJECTED, response.result);
    TEST_ASSERT_EQUAL_STRING("REJECT,COLOR,255,0,0,extra,invalid format", response.response);
}

// U1-010: Valid single-color blink
void test_U1_010_ValidSingleColorBlink(void) {
    CommandResponse response;
    processCommand("BLINK1,255,255,255,500", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_ACCEPTED, response.result);
    TEST_ASSERT_EQUAL_STRING("ACCEPTED,BLINK1,255,255,255,interval=500", response.response);
}

// U1-011: Valid two-color blink
void test_U1_011_ValidTwoColorBlink(void) {
    CommandResponse response;
    processCommand("BLINK2,255,0,0,0,0,255,300", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_ACCEPTED, response.result);
    TEST_ASSERT_EQUAL_STRING("ACCEPTED,BLINK2,255,0,0,0,0,255,interval=300", response.response);
}

// U1-012: Zero interval rejection
void test_U1_012_ZeroIntervalRejection(void) {
    CommandResponse response;
    processCommand("BLINK1,255,255,255,0", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_REJECTED, response.result);
    TEST_ASSERT_EQUAL_STRING("REJECT,BLINK1,255,255,255,0,invalid parameters", response.response);
}

// U1-013: Negative interval
void test_U1_013_NegativeInterval(void) {
    CommandResponse response;
    processCommand("BLINK1,255,255,255,-100", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_REJECTED, response.result);
    TEST_ASSERT_EQUAL_STRING("REJECT,BLINK1,255,255,255,-100,invalid parameters", response.response);
}

// U1-014: Valid rainbow command
void test_U1_014_ValidRainbowCommand(void) {
    CommandResponse response;
    processCommand("RAINBOW,50", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_ACCEPTED, response.result);
    TEST_ASSERT_EQUAL_STRING("ACCEPTED,RAINBOW,interval=50", response.response);
}

// U1-015: Zero interval rainbow
void test_U1_015_ZeroIntervalRainbow(void) {
    CommandResponse response;
    processCommand("RAINBOW,0", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_REJECTED, response.result);
    TEST_ASSERT_EQUAL_STRING("REJECT,RAINBOW,0,invalid interval", response.response);
}

// U1-016: Unknown command handling
void test_U1_016_UnknownCommandHandling(void) {
    CommandResponse response;
    processCommand("INVALID_CMD", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_REJECTED, response.result);
    TEST_ASSERT_EQUAL_STRING("REJECT,INVALID_CMD,unknown command", response.response);
}

// U1-017: Empty string handling
void test_U1_017_EmptyStringHandling(void) {
    CommandResponse response;
    processCommand("", &response);
    
    TEST_ASSERT_EQUAL(COMMAND_REJECTED, response.result);
    TEST_ASSERT_EQUAL_STRING("REJECT,,unknown command", response.response);
}

// Main test runner
int main(void) {
    UNITY_BEGIN();
    
    // Basic Commands (U1-001, U1-002)
    RUN_TEST(test_U1_001_BasicOnCommand);
    RUN_TEST(test_U1_002_BasicOffCommand);
    
    // Color Commands (U1-003 to U1-009)
    RUN_TEST(test_U1_003_ValidColorCommand);
    RUN_TEST(test_U1_004_RChannelBoundaryViolation);
    RUN_TEST(test_U1_005_GChannelBoundaryViolation);
    RUN_TEST(test_U1_006_BChannelBoundaryViolation);
    RUN_TEST(test_U1_007_NegativeRChannel);
    RUN_TEST(test_U1_008_MissingBChannel);
    RUN_TEST(test_U1_009_ExtraParametersColor);
    
    // Blink Commands (U1-010 to U1-013)
    RUN_TEST(test_U1_010_ValidSingleColorBlink);
    RUN_TEST(test_U1_011_ValidTwoColorBlink);
    RUN_TEST(test_U1_012_ZeroIntervalRejection);
    RUN_TEST(test_U1_013_NegativeInterval);
    
    // Rainbow Commands (U1-014, U1-015)
    RUN_TEST(test_U1_014_ValidRainbowCommand);
    RUN_TEST(test_U1_015_ZeroIntervalRainbow);
    
    // Error Handling (U1-016, U1-017)
    RUN_TEST(test_U1_016_UnknownCommandHandling);
    RUN_TEST(test_U1_017_EmptyStringHandling);
    
    return UNITY_END();
}