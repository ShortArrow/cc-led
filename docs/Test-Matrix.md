# 🧪 CLI-Serial Protocol Test Matrix

> **Comprehensive test scenarios for systematic validation of cc-led protocol implementation**

## 📋 Table of Contents

1. [🚨 Missing Validation Items](#-missing-validation-items)
2. [📊 Test Matrix Overview](#-test-matrix-overview)
3. [🔥 Phase 1: Basic Function Tests](#-phase-1-basic-function-tests)
4. [🎯 Phase 2: Boundary & Error Tests](#-phase-2-boundary--error-tests)
5. [🔄 Phase 3: Priority & CLI Option Conflict Tests](#-phase-3-priority--cli-option-conflict-tests)
6. [📡 Phase 4: Response Processing Tests](#-phase-4-response-processing-tests)
7. [💡 Phase 5: Digital LED Special Tests](#-phase-5-digital-led-special-tests)
8. [⚡ Phase 6: Performance & Resource Tests](#-phase-6-performance--resource-tests)
9. [🛠️ Test Utilities & Automation](#-test-utilities--automation)
10. [🔗 Related Documentation](#-related-documentation)

---

## 🚨 Missing Validation Items

### 1. **Serial Communication Layer Validation**

These critical areas are not yet covered in the current test suite:

```bash
# Serial Port Validation
- **Port Existence Check**: Verify specified port actually exists
- **Baud Rate Verification**: Confirm communication at configured baud rate
- **Device Responsiveness**: Initial handshake to confirm device presence
- **Concurrent Connection Limits**: Behavior when multiple connections attempt same port
```

### 2. **Command Combination Boundary Tests**

Complex scenarios requiring implementation:

```bash
# Advanced Edge Cases
- **Maximum Length Commands**: Very long RGB command chains
- **High-Frequency Commands**: Buffer overflow prevention
- **Mid-Command Disconnection**: Device disconnect during command transmission
- **Memory Leaks**: Resource state after numerous timeout commands
```

### 3. **Error Recovery Validation**

Currently uncovered error handling scenarios:

```bash
# Recovery Mechanisms
- **Partial Data Reception**: Handling incomplete responses
- **Character Encoding Errors**: Invalid byte sequence processing
- **Response Order Confusion**: Out-of-order responses in multi-command scenarios
```

---

## 📊 Test Matrix Overview

| Phase | Focus Area | Test Count | Priority | Implementation Status |
|-------|------------|------------|----------|----------------------|
| **Phase 1** | Basic Functions | 5 tests | 🔥 Critical | ✅ Complete |
| **Phase 2** | Boundary Values | 14 tests | 🔥 High | 🟡 Partial |
| **Phase 3** | Priority & CLI Conflicts | 10 tests | 🟡 Medium | ❌ Missing |
| **Phase 4** | Response Processing | 5 tests | 🔥 High | ✅ Complete |
| **Phase 5** | Digital LED Protocol | 4 tests | 🟡 Medium | ❌ Missing |
| **Phase 6** | Performance & Resources | 4 tests | 🟢 Low | ❌ Missing |

---

## 🔥 Phase 1: Basic Function Tests

**Priority: Critical** - Core functionality validation

| Test ID | Category | Test Case | Expected Result | Implementation Priority |
|---------|----------|-----------|----------------|------------------------|
| **P1-001** | CLI | `--on` single command | `ON\n` transmission | 🔥 High |
| **P1-002** | CLI | `--off` single command | `OFF\n` transmission | 🔥 High |
| **P1-003** | CLI | `--color red` | `COLOR,255,0,0\n` transmission | 🔥 High |
| **P1-004** | CLI | `--blink` default | `BLINK1,255,255,255,500\n` transmission | 🔥 High |
| **P1-005** | CLI | `--rainbow` default | `RAINBOW,50\n` transmission | 🔥 High |

**Self-Contained Test Examples:**

```javascript
// ❌ Avoid nested describe blocks
describe('Phase 1', () => {
  describe('Basic Function Tests', () => {
    it('should send ON command', () => { /* test */ });
  });
});

// ✅ Flat, self-documenting tests
test('P1-001: CLI --on command sends ON\\n to serial port', async () => {
  // Setup
  const mockSerialPort = createMockSerialPort();
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Execute
  await controller.turnOn();
  
  // Assert
  expect(mockSerialPort.write).toHaveBeenCalledWith('ON\n');
});

test('P1-002: CLI --off command sends OFF\\n to serial port', async () => {
  // Setup
  const mockSerialPort = createMockSerialPort();
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Execute
  await controller.turnOff();
  
  // Assert
  expect(mockSerialPort.write).toHaveBeenCalledWith('OFF\n');
});
```

---

## 🎯 Phase 2: Boundary & Error Tests

**Priority: High** - Input validation and edge cases

| Test ID | Category | Test Case | Expected Result | Validation Target |
|---------|----------|-----------|----------------|-------------------|
| **P2-001** | RGB Boundary | `--color "0,0,0"` | Success | Minimum value boundary |
| **P2-002** | RGB Boundary | `--color "255,255,255"` | Success | Maximum value boundary |
| **P2-003** | RGB-R Boundary | `--color "256,0,0"` | Error | R channel over maximum |
| **P2-004** | RGB-G Boundary | `--color "0,256,0"` | Error | G channel over maximum |
| **P2-005** | RGB-B Boundary | `--color "0,0,256"` | Error | B channel over maximum |
| **P2-006** | RGB-R Boundary | `--color "-1,0,0"` | Error | R channel below minimum |
| **P2-007** | RGB-G Boundary | `--color "0,-1,0"` | Error | G channel below minimum |
| **P2-008** | RGB-B Boundary | `--color "0,0,-1"` | Error | B channel below minimum |
| **P2-009** | RGB-R Type | `--color "1.5,0,0"` | Error | R channel type validation |
| **P2-010** | RGB-G Type | `--color "0,1.5,0"` | Error | G channel type validation |
| **P2-011** | RGB-B Type | `--color "0,0,1.5"` | Error | B channel type validation |
| **P2-012** | Interval Boundary | `--blink --interval 1` | Success | Minimum interval |
| **P2-013** | Interval Boundary | `--blink --interval 0` | Error | Zero value rejection |
| **P2-014** | Interval Boundary | `--blink --interval -100` | Error | Negative value rejection |

**Self-Contained Boundary Test Examples:**

```javascript
// ✅ Comprehensive RGB channel boundary testing
test('P2-001: RGB minimum boundary values 0,0,0 should succeed', async () => {
  // Setup: Create controller with mock serial port
  const mockSerialPort = createMockSerialPort();
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Execute: Set color to minimum RGB values
  await controller.setColor('0,0,0');
  
  // Assert: Command sent correctly
  expect(mockSerialPort.write).toHaveBeenCalledWith('COLOR,0,0,0\n');
});

test('P2-002: RGB maximum boundary values 255,255,255 should succeed', async () => {
  // Setup: Create controller with mock serial port
  const mockSerialPort = createMockSerialPort();
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Execute: Set color to maximum RGB values
  await controller.setColor('255,255,255');
  
  // Assert: Command sent correctly
  expect(mockSerialPort.write).toHaveBeenCalledWith('COLOR,255,255,255\n');
});

// R channel boundary tests
test('P2-003: R channel over maximum 256,0,0 should throw validation error', async () => {
  // Setup: Create controller (no serial connection needed)
  const controller = new LedController('COM3');
  
  // Execute & Assert: R channel validation should fail
  await expect(controller.setColor('256,0,0')).rejects.toThrow('Invalid color: 256,0,0. RGB values must be between 0 and 255');
});

test('P2-006: R channel below minimum -1,0,0 should throw validation error', async () => {
  // Setup: Create controller
  const controller = new LedController('COM3');
  
  // Execute & Assert: R channel validation should fail
  await expect(controller.setColor('-1,0,0')).rejects.toThrow('Invalid color: -1,0,0. RGB values must be between 0 and 255');
});

// G channel boundary tests
test('P2-004: G channel over maximum 0,256,0 should throw validation error', async () => {
  // Setup: Create controller
  const controller = new LedController('COM3');
  
  // Execute & Assert: G channel validation should fail
  await expect(controller.setColor('0,256,0')).rejects.toThrow('Invalid color: 0,256,0. RGB values must be between 0 and 255');
});

test('P2-007: G channel below minimum 0,-1,0 should throw validation error', async () => {
  // Setup: Create controller
  const controller = new LedController('COM3');
  
  // Execute & Assert: G channel validation should fail
  await expect(controller.setColor('0,-1,0')).rejects.toThrow('Invalid color: 0,-1,0. RGB values must be between 0 and 255');
});

// B channel boundary tests
test('P2-005: B channel over maximum 0,0,256 should throw validation error', async () => {
  // Setup: Create controller
  const controller = new LedController('COM3');
  
  // Execute & Assert: B channel validation should fail
  await expect(controller.setColor('0,0,256')).rejects.toThrow('Invalid color: 0,0,256. RGB values must be between 0 and 255');
});

test('P2-008: B channel below minimum 0,0,-1 should throw validation error', async () => {
  // Setup: Create controller
  const controller = new LedController('COM3');
  
  // Execute & Assert: B channel validation should fail
  await expect(controller.setColor('0,0,-1')).rejects.toThrow('Invalid color: 0,0,-1. RGB values must be between 0 and 255');
});

// Type validation tests for each channel
test('P2-009: R channel float value 1.5,0,0 should throw validation error', async () => {
  // Setup: Create controller
  const controller = new LedController('COM3');
  
  // Execute & Assert: R channel type validation should fail
  await expect(controller.setColor('1.5,0,0')).rejects.toThrow('Invalid color: 1.5,0,0. RGB values must be between 0 and 255');
});

test('P2-010: G channel float value 0,1.5,0 should throw validation error', async () => {
  // Setup: Create controller
  const controller = new LedController('COM3');
  
  // Execute & Assert: G channel type validation should fail
  await expect(controller.setColor('0,1.5,0')).rejects.toThrow('Invalid color: 0,1.5,0. RGB values must be between 0 and 255');
});

test('P2-011: B channel float value 0,0,1.5 should throw validation error', async () => {
  // Setup: Create controller
  const controller = new LedController('COM3');
  
  // Execute & Assert: B channel type validation should fail
  await expect(controller.setColor('0,0,1.5')).rejects.toThrow('Invalid color: 0,0,1.5. RGB values must be between 0 and 255');
});

// Interval boundary tests
test('P2-013: Interval zero value should throw validation error', async () => {
  // Setup: Create controller 
  const controller = new LedController('COM3');
  
  // Execute & Assert: Should reject zero interval
  await expect(controller.blink('red', 0)).rejects.toThrow();
});
```

**🚨 Missing Test Categories (Self-Contained Implementation Needed):**

- Color format validation with spaces: `test('Color with spaces should be rejected', () => {})`
- Port parameter validation: `test('Null port should throw error', () => {})`
- Command length limits: `test('Very long RGB chain should handle correctly', () => {})`
- **CLI option conflicts**: `test('Conflicting blink options should be handled', () => {})`

---

## 🔄 Phase 3: Priority & CLI Option Conflict Tests

**Priority: Medium** - Command precedence, interaction validation, and CLI option conflict handling

| Test ID | Category | Command Combination | Expected Result | Validation Item |
|---------|----------|---------------------|----------------|-----------------|
| **P3-001** | Priority | `--on --color red` | `ON\n` | ON priority confirmation |
| **P3-002** | Priority | `--off --blink blue` | `OFF\n` | OFF priority confirmation |
| **P3-003** | Priority | `--color red --blink green` | `BLINK1,0,255,0,500\n` | BLINK priority confirmation |
| **P3-004** | Priority | `--color red --rainbow` | `RAINBOW,50\n` | RAINBOW priority confirmation |
| **P3-005** | Priority | `--on --off` | `ON\n` | Same-level priority handling |
| **P3-006** | CLI Conflict | `--blink red --color blue` | Error or Priority Resolution | Color specification conflict |
| **P3-007** | CLI Conflict | `--blink --second-color blue` (no primary color) | Error | Missing primary color for two-color blink |
| **P3-008** | CLI Conflict | `--rainbow --interval 100 --blink` | `BLINK1,255,255,255,500\n` | Interval inheritance conflict |
| **P3-009** | CLI Conflict | `--port COM3 --port COM5` | Error or Last-Wins | Multiple port specification |
| **P3-010** | CLI Conflict | `--interval 500 --interval 1000` | `1000ms` (Last-Wins) | Multiple interval specification |

**Self-Contained Priority & CLI Conflict Test Examples:**

```javascript
// ✅ Clear priority validation tests
test('P3-001: --on flag overrides --color red in command priority', async () => {
  // Setup: Mock executeCommand to capture final command
  const mockExecute = vi.fn();
  
  // Execute: CLI with conflicting options (ON should win)
  await processCommandLineArgs(['--port', 'COM3', '--on', '--color', 'red'], mockExecute);
  
  // Assert: Only ON command executed (color ignored)
  expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({ on: true }));
  expect(mockExecute).not.toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
});

test('P3-003: --blink beats --color in command priority', async () => {
  // Setup: Mock serial port
  const mockSerialPort = createMockSerialPort();
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Execute: Process conflicting commands (blink should win)
  const options = { port: 'COM3', color: 'red', blink: 'green' };
  await executeCommand(options);
  
  // Assert: BLINK command sent (not COLOR)
  expect(mockSerialPort.write).toHaveBeenCalledWith('BLINK1,0,255,0,500\n');
  expect(mockSerialPort.write).not.toHaveBeenCalledWith('COLOR,255,0,0\n');
});

// ✅ CLI option conflict validation tests
test('P3-006: Conflicting color specifications should be handled consistently', async () => {
  // Setup: Mock serial port
  const mockSerialPort = createMockSerialPort();
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Execute: Conflicting color options (--blink red --color blue)
  const options = { port: 'COM3', blink: 'red', color: 'blue' };
  await executeCommand(options);
  
  // Assert: Blink takes priority, red color used (not blue)
  expect(mockSerialPort.write).toHaveBeenCalledWith('BLINK1,255,0,0,500\n');
  expect(mockSerialPort.write).not.toHaveBeenCalledWith('COLOR,0,0,255\n');
});

test('P3-007: Missing primary color for two-color blink should throw error', async () => {
  // Setup: Create controller
  const controller = new LedController('COM3');
  
  // Execute & Assert: Should reject incomplete two-color blink specification
  const options = { port: 'COM3', blink: true, secondColor: 'blue' };
  await expect(executeCommand(options)).rejects.toThrow('Primary color required for two-color blink');
});

test('P3-009: Multiple port specifications should throw error', async () => {
  // Setup: Mock CLI parser with duplicate ports
  
  // Execute & Assert: Should reject multiple port specifications
  await expect(
    processCommandLineArgs(['--port', 'COM3', '--port', 'COM5', '--on'])
  ).rejects.toThrow('Multiple port specifications not allowed');
});

test('P3-010: Multiple interval specifications should use last value (last-wins)', async () => {
  // Setup: Mock serial port
  const mockSerialPort = createMockSerialPort();
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Execute: Multiple interval values (should use last one)
  const options = { port: 'COM3', blink: 'red', interval: [500, 1000] }; // Last wins: 1000
  await executeCommand(options);
  
  // Assert: Last interval value used
  expect(mockSerialPort.write).toHaveBeenCalledWith('BLINK1,255,0,0,1000\n');
});

test('P3-008: Interval inheritance conflict should be resolved clearly', async () => {
  // Setup: Mock serial port
  const mockSerialPort = createMockSerialPort();
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Execute: Conflicting commands with interval (--rainbow --interval 100 --blink)
  const options = { port: 'COM3', rainbow: true, blink: true, interval: 100 };
  await executeCommand(options);
  
  // Assert: Blink wins priority, but interval is inherited from conflicted command
  expect(mockSerialPort.write).toHaveBeenCalledWith('BLINK1,255,255,255,100\n');
});
```

**🚨 Implementation Status:** Priority and CLI conflict tests need implementation (currently missing)

---

## 📡 Phase 4: Response Processing Tests

**Priority: High** - Microcontroller communication validation

| Test ID | Category | Simulated Response | Expected Behavior | Validation Item |
|---------|----------|-------------------|-------------------|-----------------|
| **P4-001** | ACCEPTED | `ACCEPTED,ON` | Success display | Basic success processing |
| **P4-002** | ACCEPTED | `ACCEPTED,COLOR,255,0,0` | Success display | Parameterized success |
| **P4-003** | REJECT | `REJECT,COLOR,invalid format` | Error display | Basic rejection processing |
| **P4-004** | Timeout | (no response) | Timeout display | Timeout handling |
| **P4-005** | Invalid Response | `STATUS,OK,ready` | Treat as timeout | Invalid response rejection |

**Self-Contained Response Test Examples:**

```javascript
// ✅ Direct response validation tests
test('P4-001: ACCEPTED,ON response displays success message', async () => {
  // Setup: Mock console capture and serial port
  const consoleCapture = captureConsoleOutput();
  const mockSerialPort = createMockSerialPortWithResponse('ACCEPTED,ON');
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Execute: Send command and wait for response
  await controller.sendCommand('ON');
  
  // Assert: Success messages displayed
  const logs = consoleCapture.getLogs();
  expect(logs).toContain('Sent command: ON');
  expect(logs).toContain('Device response: ACCEPTED,ON');
  consoleCapture.restore();
});

test('P4-003: REJECT response with error message displays correctly', async () => {
  // Setup: Mock console and error response
  const consoleCapture = captureConsoleOutput();
  const mockSerialPort = createMockSerialPortWithResponse('REJECT,COLOR,invalid format');
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Execute: Send invalid command
  await controller.sendCommand('COLOR,invalid');
  
  // Assert: Error message displayed correctly
  const logs = consoleCapture.getLogs();
  expect(logs).toContain('Device response: REJECT,COLOR,invalid format');
  consoleCapture.restore();
});

test('P4-004: No response triggers timeout message', async () => {
  // Setup: Mock console and no response (timeout scenario)
  const consoleCapture = captureConsoleOutput();
  const mockSerialPort = createMockSerialPortWithNoResponse();
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Execute: Send command (will timeout)
  await controller.sendCommand('ON');
  
  // Assert: Timeout message displayed
  const logs = consoleCapture.getLogs();
  expect(logs).toContain('No response received from device (timeout)');
  consoleCapture.restore();
});
```

**🚨 Additional Response Scenarios (Need Self-Contained Tests):**

- `test('Partial response with incomplete data should timeout', () => {})`
- `test('Response with Unicode characters should be handled correctly', () => {})`
- `test('Response with multiple commas should parse correctly', () => {})`

---

## 💡 Phase 5: Digital LED Special Tests

**Priority: Medium** - Digital LED protocol-specific validation

| Test ID | Category | Test Case | Expected Behavior | Validation Item |
|---------|----------|-----------|-------------------|-----------------|
| **P5-001** | Digital LED | `--color red` (Digital board) | Warning + command sent | Color limitation warning |
| **P5-002** | Digital LED | `--color white` (Digital board) | No warning + command sent | White color exception |
| **P5-003** | Digital LED | `--rainbow` (Digital board) | Warning + RAINBOW sent | Rainbow limitation warning |
| **P5-004** | Digital LED | `--blink red --second-color blue` (Digital) | Warning + BLINK2 sent | Two-color limitation warning |

**Self-Contained Digital LED Test Examples:**

```javascript
// ✅ Clear Digital LED protocol tests
test('P5-001: Digital board shows color warning and sends command for red', async () => {
  // Setup: Digital LED board mock and console capture
  const mockBoard = { getLedProtocol: () => 'Digital' };
  const consoleCapture = captureConsoleOutput();
  const mockSerialPort = createMockSerialPort();
  const controller = new LedController('COM3', { board: mockBoard });
  await controller.connect();
  
  // Execute: Set non-white color on digital LED
  await controller.setColor('red');
  
  // Assert: Warning displayed and command still sent
  const logs = consoleCapture.getLogs();
  expect(logs).toContain("Note: Digital LED does not support colors. Color 'red' ignored, turning LED on.");
  expect(mockSerialPort.write).toHaveBeenCalledWith('COLOR,255,0,0\n');
  consoleCapture.restore();
});

test('P5-002: Digital board with white color shows no warning', async () => {
  // Setup: Digital LED board and console capture
  const mockBoard = { getLedProtocol: () => 'Digital' };
  const consoleCapture = captureConsoleOutput();
  const mockSerialPort = createMockSerialPort();
  const controller = new LedController('COM3', { board: mockBoard });
  await controller.connect();
  
  // Execute: Set white color (should be exception)
  await controller.setColor('white');
  
  // Assert: No warning, command sent normally
  const logs = consoleCapture.getLogs();
  expect(logs).not.toContain('Note: Digital LED does not support colors');
  expect(mockSerialPort.write).toHaveBeenCalledWith('COLOR,255,255,255\n');
  consoleCapture.restore();
});
```

---

## ⚡ Phase 6: Performance & Resource Tests

**Priority: Low** - System performance and resource management

| Test ID | Category | Test Case | Expected Result | Measurement Item |
|---------|----------|-----------|----------------|------------------|
| **P6-001** | Performance | Response time (test env) | < 20ms | Response speed |
| **P6-002** | Performance | Response time (production) | < 50ms | Response speed |
| **P6-003** | Resources | 1000 consecutive timeouts | No memory leaks | Memory management |
| **P6-004** | Concurrency | Multiple ports simultaneously | No interference | Parallel processing |

**Self-Contained Performance Test Examples:**

```javascript
// ✅ Direct performance validation tests
test('P6-001: Response processing completes under 20ms in test environment', async () => {
  // Setup: Test environment and mock response
  process.env.NODE_ENV = 'test';
  const mockSerialPort = createMockSerialPortWithResponse('ACCEPTED,ON');
  const controller = new LedController('COM3');
  await controller.connect();
  
  // Execute: Measure response time
  const startTime = Date.now();
  await controller.sendCommand('ON');
  const endTime = Date.now();
  
  // Assert: Response time under threshold
  expect(endTime - startTime).toBeLessThan(20);
});

test('P6-003: 1000 consecutive timeout commands do not cause memory leaks', async () => {
  // Setup: Memory measurement and timeout scenario
  const initialMemory = process.memoryUsage();
  const mockSerialPort = createMockSerialPortWithNoResponse();
  
  // Execute: Run many timeout commands
  for (let i = 0; i < 1000; i++) {
    const controller = new LedController('COM3');
    await controller.connect();
    await controller.sendCommand('ON'); // Will timeout
    await controller.disconnect();
  }
  
  // Force garbage collection and measure memory
  if (global.gc) global.gc();
  const finalMemory = process.memoryUsage();
  
  // Assert: Memory usage didn't grow excessively
  const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
  expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
});

test('P6-004: Multiple controllers on different ports run without interference', async () => {
  // Setup: Multiple controllers with different ports
  const controller1 = new LedController('COM3');
  const controller2 = new LedController('COM5');
  const controller3 = new LedController('COM7');
  
  await Promise.all([
    controller1.connect(),
    controller2.connect(),
    controller3.connect()
  ]);
  
  // Execute: Send commands concurrently
  const results = await Promise.all([
    controller1.setColor('red'),
    controller2.setColor('green'),
    controller3.setColor('blue')
  ]);
  
  // Assert: All operations completed successfully (no interference)
  expect(results).toHaveLength(3);
  // Each controller should have sent its own command independently
});
```

---

## 🛠️ Test Utilities & Automation

### **1. Test Matrix Data Structure**

```javascript
// test/helpers/validation-matrix.js
export const testMatrix = {
  boundaryValues: {
    rgb: { 
      valid: ["0,0,0", "255,255,255", "100,150,200"],
      // Individual channel boundary tests
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
  priorities: [
    { input: "--on --color red", expected: "ON\n", priority: "ON wins" },
    { input: "--color red --blink green", expected: "BLINK1,0,255,0,500\n", priority: "BLINK wins" },
    { input: "--color purple --rainbow --interval 30", expected: "RAINBOW,30\n", priority: "RAINBOW wins" }
  ],
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
  }
};
```

### **2. Self-Contained Test Generation (Avoid Over-Abstraction)**

```javascript
// ❌ Avoid complex test generation that obscures test intent
describe('Auto-generated RGB Boundary Tests', () => {
  generateBoundaryTests('rgb').forEach(testCase => {
    it(`${testCase.id}: ${testCase.input}`, async () => { /* unclear test logic */ });
  });
});

// ✅ Write explicit, self-contained boundary tests for each RGB channel
test('RGB boundary 0,0,0 minimum values should succeed', async () => {
  const controller = new LedController('COM3');
  await expect(controller.setColor('0,0,0')).resolves.not.toThrow();
});

test('RGB boundary 255,255,255 maximum values should succeed', async () => {
  const controller = new LedController('COM3');
  await expect(controller.setColor('255,255,255')).resolves.not.toThrow();
});

// R channel specific boundary tests
test('R channel boundary 256,0,0 over maximum should fail', async () => {
  const controller = new LedController('COM3');
  await expect(controller.setColor('256,0,0')).rejects.toThrow('Invalid color: 256,0,0');
});

test('R channel boundary -1,0,0 below minimum should fail', async () => {
  const controller = new LedController('COM3');
  await expect(controller.setColor('-1,0,0')).rejects.toThrow('Invalid color: -1,0,0');
});

// G channel specific boundary tests
test('G channel boundary 0,256,0 over maximum should fail', async () => {
  const controller = new LedController('COM3');
  await expect(controller.setColor('0,256,0')).rejects.toThrow('Invalid color: 0,256,0');
});

test('G channel boundary 0,-1,0 below minimum should fail', async () => {
  const controller = new LedController('COM3');
  await expect(controller.setColor('0,-1,0')).rejects.toThrow('Invalid color: 0,-1,0');
});

// B channel specific boundary tests
test('B channel boundary 0,0,256 over maximum should fail', async () => {
  const controller = new LedController('COM3');
  await expect(controller.setColor('0,0,256')).rejects.toThrow('Invalid color: 0,0,256');
});

test('B channel boundary 0,0,-1 below minimum should fail', async () => {
  const controller = new LedController('COM3');
  await expect(controller.setColor('0,0,-1')).rejects.toThrow('Invalid color: 0,0,-1');
});

// Simple utility for common setup (when truly needed)
function createTestController(port = 'COM3') {
  return new LedController(port);
}
```

### **3. Simple Test Organization (Avoid Complex Tracking)**

```javascript
// ❌ Avoid complex test tracking systems
export class TestCoverageTracker { /* complex implementation */ }

// ✅ Use simple, direct test organization
// Group tests by filename, not by abstract categories

// test/basic-commands.test.js
test('ON command sends ON\\n to serial port', () => {});
test('OFF command sends OFF\\n to serial port', () => {});
test('COLOR command sends RGB values to serial port', () => {});

// test/boundary-validation.test.js  
test('RGB minimum 0,0,0 should succeed', () => {});
test('RGB maximum 255,255,255 should succeed', () => {});
test('RGB over maximum 256,0,0 should fail', () => {});

// test/command-priority.test.js
test('ON flag overrides COLOR flag in command priority', () => {});
test('BLINK flag overrides COLOR flag in command priority', () => {});

// test/response-processing.test.js
test('ACCEPTED response displays success message', () => {});
test('REJECT response displays error message', () => {});
test('No response triggers timeout message', () => {});

// test/digital-led-protocol.test.js
test('Digital LED shows warning for non-white colors', () => {});
test('Digital LED shows no warning for white color', () => {});
```

---

## 🔗 Related Documentation

- **[🔌 CLI-Serial Protocol Specification](CLI-Serial-Protocol-Specification.md)** - Complete protocol reference
- **[🧪 Test Files](../test/)** - Current test implementation
- **[🔧 CONTRIBUTING.md](CONTRIBUTING.md)** - Development and testing guidelines
- **[🎛️ controller.js](../src/controller.js)** - Implementation reference

---

## 📊 Implementation Roadmap

### **Phase 1 Priority (Immediate Implementation)**

1. ✅ **P2-003 to P2-014**: RGB channel boundary and interval tests
2. ❌ **P3-001 to P3-010**: Command priority and CLI conflict tests
3. ❌ **P5-001 to P5-004**: Digital LED protocol tests

### **Phase 2 Priority (Next Sprint)**

1. **P6-001 to P6-004**: Performance and resource tests
2. **Enhanced error recovery tests**
3. **Serial communication layer validation**

### **Test Utilities Setup**

1. **Matrix data structure** implementation
2. **Auto-generation utilities** for boundary tests
3. **Coverage tracking system**

---

**🌟 Self-Contained Test Implementation Guidelines:**

- **Write explicit, readable tests**: Each test should be immediately understandable
- **Avoid nested describe blocks**: Use flat test structure with descriptive names
- **Keep setup inline**: Include necessary setup within each test (avoid complex beforeEach)
- **Group by functionality**: Organize tests in separate files by feature area
- **Implement missing high-priority tests first**: Focus on P2 (boundary), P3 (priority & conflicts), P5 (digital LED)
- **Use simple utilities only when truly needed**: Avoid over-abstraction in test helpers

---

*Built with ❤️ for systematic validation of cc-led protocol implementation*
