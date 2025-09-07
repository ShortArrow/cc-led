#ifndef UNITY_CONFIG_H
#define UNITY_CONFIG_H

// Unity configuration for Arduino Command Processing Tests
#include <stdio.h>
#include <stdlib.h>

// Output configuration
#define UNITY_OUTPUT_CHAR(c) putchar(c)
#define UNITY_OUTPUT_FLUSH() fflush(stdout)

// Memory allocation (use standard C library)
#define UNITY_OUTPUT_COMPLETE() printf("\n")

// Test running configuration
#define UNITY_INCLUDE_PRINT_FORMATTED

// Color output support (optional, disable if needed)
#ifndef UNITY_OUTPUT_COLOR
#define UNITY_OUTPUT_COLOR
#endif

#endif // UNITY_CONFIG_H