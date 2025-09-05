/**
 * @fileoverview Test Matrix Data Structure
 * 
 * Implements Test-Matrix.md validation data for systematic testing.
 * Provides boundary values and test cases for all 9 phases.
 */

export const testMatrix = {
  // Phase 2: Boundary Values
  boundaryValues: {
    rgb: { 
      valid: ["0,0,0", "255,255,255", "100,150,200"],
      // Individual channel boundary tests per Test-Matrix.md
      rChannelInvalid: ["256,0,0", "-1,0,0", "1.5,0,0"],
      gChannelInvalid: ["0,256,0", "0,-1,0", "0,1.5,0"],
      bChannelInvalid: ["0,0,256", "0,0,-1", "0,0,1.5"],
      // Format validation
      formatInvalid: ["100,150", "100,150,200,50", " 100,150,200 ", "100, 150, 200"]
    },
    intervals: { 
      valid: [1, 500, 10000],
      invalid: [0, -100, 1.5]
    }
  },

  // Phase 3: Priority & CLI Option Conflicts
  priorities: [
    { input: "--on --color red", expected: "ON\n", priority: "ON wins" },
    { input: "--off --blink blue", expected: "OFF\n", priority: "OFF wins" },
    { input: "--color red --blink green", expected: "BLINK1,0,255,0,500\n", priority: "BLINK wins" },
    { input: "--color purple --rainbow --interval 30", expected: "RAINBOW,30\n", priority: "RAINBOW wins" },
    { input: "--on --off", expected: "ON\n", priority: "ON wins over OFF" }
  ],

  // Phase 4: Response Processing
  responses: {
    accepted: [
      "ACCEPTED,ON",
      "ACCEPTED,COLOR,255,0,0",
      "ACCEPTED,BLINK1,0,255,0,interval=500"
    ],
    rejected: [
      "REJECT,COLOR,invalid format",
      "REJECT,BLINK1,invalid parameters",
      "REJECT,UNKNOWN,unknown command"
    ],
    invalid: [
      "STATUS,OK,ready",
      "ACCEPTED_BUT_NOT_EXACT,ON",
      "",
      "\\t\\n"
    ]
  },

  // Phase 5: Digital LED Protocol
  digitalLedCases: [
    { color: "red", expectWarning: true, description: "Color warning for non-white" },
    { color: "white", expectWarning: false, description: "No warning for white" },
    { command: "rainbow", expectWarning: true, description: "Rainbow limitation warning" },
    { command: "blink2", expectWarning: true, description: "Two-color limitation warning" }
  ],

  // Phase 6: Performance Thresholds
  performance: {
    testEnvironmentMaxMs: 20,
    productionMaxMs: 50,
    memoryLeakTestIterations: 1000,
    maxMemoryGrowthMB: 10
  },

  // Phase 8: Config Priority Order
  configPriority: [
    { source: "CLI", priority: 1, description: "Command-line argument" },
    { source: "ENV", priority: 2, description: "Environment variable" },
    { source: "DOTENV", priority: 3, description: ".env file" }
  ]
};