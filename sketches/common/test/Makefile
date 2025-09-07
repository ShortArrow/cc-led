# Unity Test Makefile for Arduino Command Processing Tests
# Test Framework: ThrowTheSwitch/Unity
# Target: gcc/g++ native testing (no PlatformIO required)

# Compiler settings
CC = gcc
CFLAGS = -std=c99 -Wall -Wextra -DUNITY_INCLUDE_CONFIG_H
INCLUDES = -IUnity/src -I../src

# Source files
UNITY_SRC = Unity/src/unity.c
SRC_FILES = ../src/CommandProcessor.c
TEST_FILES = test_command_processor.c

# Output
TARGET = test_command_processor
OBJECTS = $(UNITY_SRC:.c=.o) $(SRC_FILES:.c=.o) $(TEST_FILES:.c=.o)

# Build rules
all: $(TARGET)

$(TARGET): $(OBJECTS)
	$(CC) $(OBJECTS) -o $(TARGET)

%.o: %.c
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

# Test execution
test: $(TARGET)
	./$(TARGET)

# Clean up
clean:
	rm -f $(OBJECTS) $(TARGET)
	rm -f $(TARGET).exe  # Windows cleanup

# Platform-specific adjustments
ifeq ($(OS),Windows_NT)
    TARGET := $(TARGET).exe
    RM = del /Q
    PATHSEP = \\
else
    RM = rm -f
    PATHSEP = /
endif

.PHONY: all test clean