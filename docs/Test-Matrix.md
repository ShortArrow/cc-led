# CLI-Serial Protocol Test Matrix

> **Complete test specification and validation matrix for cc-led protocol implementation**  
> **Total: 121 test cases across 12 phases**

## Table of Contents

1. [Test Completeness Analysis](#test-completeness-analysis)
2. [Test Matrix Overview](#test-matrix-overview)
3. [Test Implementation Guidelines](#test-implementation-guidelines)
4. [Phase 1: Basic Function Tests](#phase-1-basic-function-tests)
5. [Phase 2: Boundary & Error Tests](#phase-2-boundary--error-tests)
6. [Phase 3: Priority & CLI Option Conflict Tests](#phase-3-priority--cli-option-conflict-tests)
7. [Phase 4: Response Processing Tests](#phase-4-response-processing-tests)
8. [Phase 5: Digital LED Special Tests](#phase-5-digital-led-special-tests)
9. [Phase 6: Performance & Resource Tests](#phase-6-performance--resource-tests)
10. [Phase 7: Arduino Integration Tests](#phase-7-arduino-integration-tests)
11. [Phase 8: Config & Environment Tests](#phase-8-config--environment-tests)
12. [Phase 9: End-to-End CLI Tests](#phase-9-end-to-end-cli-tests)
13. [Phase 10: Arduino CLI Command Generation Tests](#phase-10-arduino-cli-command-generation-tests)
14. [Phase 11: Arduino Command Processing Tests](#phase-11-arduino-command-processing-tests)
15. [Phase 12: Arduino CLI Configuration Priority Tests](#phase-12-arduino-cli-configuration-priority-tests)
16. [Related Documentation](#related-documentation)

---

## Test Completeness Analysis

### ✅ **Fully Covered Areas**

The current test suite provides comprehensive coverage for:

```bash
# Core Functionality (Phases 1-5)
- ✅ **Basic Commands**: ON/OFF/COLOR/BLINK/RAINBOW command generation
- ✅ **Boundary Validation**: RGB value limits, interval boundaries, input validation
- ✅ **Command Priority**: Conflict resolution and precedence handling
- ✅ **Response Processing**: ACCEPTED/REJECT/timeout response handling
- ✅ **Digital LED Protocol**: Board-specific warnings and limitations

# Integration & System (Phases 6-10)
- ✅ **Performance Testing**: Response time and memory leak validation
- ✅ **Arduino CLI Integration**: Command execution and parameter passing
- ✅ **Configuration Management**: Environment variables and .env file priority
- ✅ **End-to-End CLI**: Argument parsing and command flow validation
- ✅ **Command Generation**: Full Arduino CLI command transformation
- ✅ **Arduino Command Processing**: Microcontroller-side parsing and response generation
```

### 🔄 **Advanced Validation Areas** (Future Implementation)

These areas require real hardware or advanced testing infrastructure:

```bash
# Physical Hardware Validation
- **Port Existence Check**: Verify specified serial port actually exists
- **Device Responsiveness**: Initial handshake with real Arduino hardware
- **Baud Rate Verification**: Confirm communication at configured baud rate
- **Concurrent Connection Limits**: Multiple process port access behavior

# Advanced Error Scenarios
- **Mid-Command Disconnection**: Device disconnect during command transmission
- **Partial Data Reception**: Handling incomplete serial responses
- **High-Frequency Commands**: Buffer overflow and rate limiting
- **Character Encoding Errors**: Invalid byte sequence processing in responses
```

---

## Test Matrix Overview

| Phase | Focus Area | Test Count | Priority |
|-------|------------|------------|----------|
| **Phase 1** | Basic Functions | 5 tests | 🔥 Critical |
| **Phase 2** | Boundary Values | 14 tests | 🔥 High |
| **Phase 3** | Priority & CLI Conflicts | 14 tests | 🟡 Medium |
| **Phase 4** | Response Processing | 5 tests | 🔥 High |
| **Phase 5** | Digital LED Protocol | 4 tests | 🟡 Medium |
| **Phase 6** | Performance & Resources | 4 tests | 🟢 Low |
| **Phase 7** | Arduino Integration | 12 tests | 🔥 High |
| **Phase 8** | Config & Environment | 11 tests | 🟡 Medium |
| **Phase 9** | End-to-End CLI | 10 tests | 🔥 High |
| **Phase 10** | Arduino CLI Command Generation | 10 tests | 🔥 High |
| **Phase 11** | Arduino Command Processing | 17 tests | 🔥 Critical |

---

## Test Implementation Guidelines

### Dependency Injection Architecture (Clean Architecture Implementation)

#### Interface-Based Mock Strategy
The test suite implements Clean Architecture principles using dependency injection with interfaces:

```javascript
// ✅ RECOMMENDED: Interface-based mocks with dependency injection
import { ArduinoService } from '../../src/arduino.js';
import { MockFileSystemAdapter } from '../adapters/mock-file-system.adapter.js';
import { MockProcessExecutorAdapter } from '../adapters/mock-process-executor.adapter.js';

test('A1-006: Sketch directory validation using dependency injection', async () => {
  const mockFileSystem = new MockFileSystemAdapter();
  const mockProcessExecutor = new MockProcessExecutorAdapter();
  
  // Configure mock behavior specific to this test
  mockFileSystem.setExistsSyncBehavior((path) => {
    return !path.includes('non-existent-sketch');
  });
  
  const arduino = new ArduinoService(mockFileSystem, mockProcessExecutor);
  // Test implementation...
});
```

#### Mock Management Best Practices
- **Use stateless interface-based mocks**: Each test creates fresh mock instances
- **Avoid module mocking (`vi.mock()`)** for internal dependencies - leads to state interference
- **Configure mock behavior per test**: Use adapter methods like `setExistsSyncBehavior()`
- **Cross-platform compatibility**: Normalize path separators in mock logic

#### Module Mock Usage Guidelines
Module mocks should **only** be used for:
- External dependencies (e.g., `child_process`, `fs` in legacy tests)
- E2E testing where full system integration is required
- Third-party libraries that cannot be easily dependency-injected

```javascript
// ✅ ACCEPTABLE: External dependency mocking for E2E tests
vi.mock('../../src/controller.js', () => ({
  executeCommand: vi.fn(async () => {})
}));

// ❌ AVOID: Internal service mocking - use dependency injection instead
vi.mock('../../src/arduino.js'); // This causes test interference
```

### Anti-pattern Avoidance

#### Eliminated Anti-patterns
- **❌ Complex beforeEach/afterEach** - Replaced with per-test dependency injection
- **❌ Module mock state interference** - Solved with interface-based adapters  
- **❌ Shared mock state** - Each test creates isolated mock instances
- **❌ Mock reset brittleness** - No longer needed with stateless design

#### Current Best Practices
- **✅ Self-contained tests**: Each test manages its own dependencies
- **✅ Predictable mock behavior**: Stateless adapters with per-test configuration
- **✅ Test independence**: No cross-test state sharing or interference
- **✅ Clear separation of concerns**: Production vs. test adapters

### File Structure Priority
- Prefer directory/file separation over nested describe blocks
- Group related tests in separate files by functionality
- Use flat test structure for better readability
- **NEW:** Organize adapters in `test/adapters/` directory for reusability

### Test Naming Convention

#### Test ID Prefix Definitions
The test ID prefixes indicate the category of testing:

- **P** (Protocol): Core protocol and basic functionality tests
  - P1-xxx: Basic function tests (ON/OFF/COLOR commands)
  - P2-xxx: Boundary value and input validation tests
  - P3-xxx: Command priority and conflict resolution tests
  - P4-xxx: Response processing and microcontroller communication
  - P5-xxx: Digital LED protocol specific tests
  - P6-xxx: Performance and resource management tests

- **A** (Arduino): Arduino CLI integration and hardware tests
  - A1-xxx: Arduino CLI execution and compilation tests
  - A2-xxx: Arduino CLI command generation and parameter transformation

- **C** (Configuration): Configuration and environment management tests
  - C1-xxx: Config file loading, environment variables, and priority chain

- **E** (End-to-End): Complete CLI workflow and integration tests
  - E1-xxx: CLI argument parsing and command execution flow

#### Test ID Format
- Format: `[Prefix][Phase]-[Number]`
- Example: `P1-001` = Protocol Phase 1, Test 001
- Include expected behavior in test names
- Make test names self-documenting

**Test ID Examples:**
```javascript
// Protocol test example
test('P1-001: CLI --on command sends ON\n to serial port', () => {});

// Arduino integration test example
test('A1-005: Sketch compilation with FQBN generates build directory', () => {});

// Configuration test example  
test('C1-007: Command-line argument has highest priority', () => {});

// End-to-end test example
test('E1-002: CLI parses led --blink green --second-color blue', () => {});
```

---

## Phase 1: Basic Function Tests

**Priority: Critical** - Core functionality validation

| Test ID | Category | Test Case | Expected Result | Implementation Priority |
|---------|----------|-----------|----------------|------------------------|
| **P1-001** | CLI | `--on` single command | `ON\n` transmission | 🔥 High |
| **P1-002** | CLI | `--off` single command | `OFF\n` transmission | 🔥 High |
| **P1-003** | CLI | `--color red` | `COLOR,255,0,0\n` transmission | 🔥 High |
| **P1-004** | CLI | `--blink` default | `BLINK1,255,255,255,500\n` transmission | 🔥 High |
| **P1-005** | CLI | `--rainbow` default | `RAINBOW,50\n` transmission | 🔥 High |

**Test ID Examples:**
```javascript
test('P1-001: CLI --on command sends ON\\n to serial port', () => {});
test('P1-002: CLI --off command sends OFF\\n to serial port', () => {});
```

---

## Phase 2: Boundary & Error Tests

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

**Test ID Examples:**
```javascript
test('P2-001: RGB minimum boundary values 0,0,0 should succeed', () => {});
test('P2-003: R channel over maximum 256,0,0 should throw validation error', () => {});
```

**Missing Test Categories:**
- Color format validation with spaces
- Port parameter validation  
- Command length limits
- CLI option conflicts

---

## Phase 3: Priority & CLI Option Conflict Tests

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
| **P3-011** | Port Priority | CLI arg with env var set | CLI arg wins | --port overrides SERIAL_PORT env |
| **P3-012** | Port Priority | No CLI arg, env var set | Env var used | SERIAL_PORT environment fallback |
| **P3-013** | Port Priority | No CLI/env, .env file exists | .env value used | .env file as last fallback |
| **P3-014** | Port Priority | No port in any source | Error thrown | Descriptive error when port missing |

**Test ID Examples:**
```javascript
test('P3-001: --on flag overrides --color red in command priority', () => {});
test('P3-006: Conflicting color specifications should be handled consistently', () => {});
```


---

## Phase 4: Response Processing Tests

**Priority: High** - Microcontroller communication validation

| Test ID | Category | Simulated Response | Expected Behavior | Validation Item |
|---------|----------|-------------------|-------------------|-----------------|
| **P4-001** | ACCEPTED | `ACCEPTED,ON` | Success display | Basic success processing |
| **P4-002** | ACCEPTED | `ACCEPTED,COLOR,255,0,0` | Success display | Parameterized success |
| **P4-003** | REJECT | `REJECT,COLOR,invalid format` | Error display | Basic rejection processing |
| **P4-004** | Timeout | (no response) | Timeout display | Timeout handling |
| **P4-005** | Invalid Response | `STATUS,OK,ready` | Treat as timeout | Invalid response rejection |

**Test ID Examples:**
```javascript
test('P4-001: ACCEPTED,ON response displays success message', () => {});
test('P4-004: No response triggers timeout message', () => {});
```

**Additional Response Scenarios:**
- Partial response with incomplete data
- Response with Unicode characters  
- Response with multiple commas

---

## Phase 5: Digital LED Special Tests

**Priority: Medium** - Digital LED protocol-specific validation

| Test ID | Category | Test Case | Expected Behavior | Validation Item |
|---------|----------|-----------|-------------------|-----------------|
| **P5-001** | Digital LED | `--color red` (Digital board) | Warning + command sent | Color limitation warning |
| **P5-002** | Digital LED | `--color white` (Digital board) | No warning + command sent | White color exception |
| **P5-003** | Digital LED | `--rainbow` (Digital board) | Warning + RAINBOW sent | Rainbow limitation warning |
| **P5-004** | Digital LED | `--blink red --second-color blue` (Digital) | Warning + BLINK2 sent | Two-color limitation warning |

**Test ID Examples:**
```javascript
test('P5-001: Digital board shows color warning and sends command for red', () => {});
test('P5-002: Digital board with white color shows no warning', () => {});
```

---

## Phase 6: Performance & Resource Tests

**Priority: Low** - System performance and resource management

| Test ID | Category | Test Case | Expected Result | Measurement Item |
|---------|----------|-----------|----------------|------------------|
| **P6-001** | Performance | Response time (test env) | < 20ms | Response speed |
| **P6-002** | Performance | Response time (production) | < 50ms | Response speed |
| **P6-003** | Resources | 1000 consecutive timeouts | No memory leaks | Memory management |
| **P6-004** | Concurrency | Multiple ports simultaneously | No interference | Parallel processing |

**Test ID Examples:**
```javascript
test('P6-001: Response processing completes under 20ms in test environment', () => {});
test('P6-003: 1000 consecutive timeout commands do not cause memory leaks', () => {});
```

---

## Related Documentation

- **[CLI-Serial Protocol Specification](CLI-Serial-Protocol-Specification.md)** - Complete protocol reference
- **[Test Files](../test/)** - Current test implementation
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development and testing guidelines
- **[controller.js](../src/controller.js)** - Implementation reference

---

## Implementation Roadmap

### Completed Implementation Status

1. ✅ **P1-001 to P1-005**: Basic function tests (Phase 1)
2. ✅ **P2-001 to P2-014**: RGB boundary and interval tests (Phase 2)  
3. ✅ **P3-001 to P3-014**: Command priority and CLI conflict tests (Phase 3)
4. ✅ **P4-001 to P4-005**: Response processing tests (Phase 4)
5. ✅ **P5-001 to P5-004**: Digital LED protocol tests (Phase 5)
6. ✅ **P6-001 to P6-004**: Performance and resource tests (Phase 6)
7. ✅ **A1-001 to A1-012**: Arduino integration tests (Phase 7)
8. ✅ **C1-001 to C1-011**: Config and environment tests (Phase 8)
9. ✅ **E1-001 to E1-004**: End-to-end CLI tests (Phase 9)
10. ✅ **A2-001 to A2-010**: Arduino CLI command generation tests (Phase 10)

### Current Status: Comprehensive Test Suite Complete

1. **Test prefix standardization**: All tests follow PX-XXX format for systematic tracking
2. **Comprehensive test matrix**: 97 total test cases across 10 phases - **COMPLETE**
3. **Complete protocol coverage**: From basic commands to complex integration scenarios
4. **Clean Architecture implementation**: **NEW** - Dependency injection with interface-based mocks
5. **Resolved test interference**: **FIXED** - Phase 7+8 tests now run reliably in full suite

### Test Quality Assessment

| Quality Metric | Status | Details |
|---------------|--------|---------|
| **Test Coverage** | ✅ Complete | All 10 phases implemented with 97 test cases |
| **Protocol Validation** | ✅ Complete | Full CLI-to-serial command generation coverage |
| **Arduino Integration** | ✅ Complete | Comprehensive Arduino CLI command generation tests |
| **Mock Isolation** | ✅ Complete | **IMPROVED**: Phase 7+8 using interface-based mocks with zero interference |
| **Test Independence** | ✅ Complete | Self-contained tests with stateless mock design |
| **Architecture Quality** | ✅ Complete | **NEW**: Clean Architecture with dependency injection implemented |

### Future Enhancements

1. **Phase 9 CLI E2E Test Migration**: Convert remaining module mocks to dependency injection pattern
2. **Real Hardware Testing**: Integration tests with actual Arduino hardware
3. **Serial Communication Layer**: Low-level protocol validation with real serial ports
4. **Performance Benchmarking**: Automated performance regression detection
5. **Error Recovery Testing**: Advanced timeout and connection handling scenarios

---

## Phase 7: Arduino Integration Tests

**Priority: High** - Arduino CLI integration and deployment validation  
**Architecture: ✅ Clean Architecture with Dependency Injection** - **COMPLETED**

| Test ID | Category | Test Case | Expected Result | Validation Item |
|---------|----------|-----------|----------------|-----------------|
| **A1-001** | CLI Execution | arduino-cli command execution with config | Success stdout | Basic CLI integration |
| **A1-002** | Log Level | arduino-cli with log level parameter | Log level applied | Logging integration |
| **A1-003** | Default Log | arduino-cli without log level | Info level default | Default behavior |
| **A1-004** | Error Handling | arduino-cli non-zero exit code | Error with stderr | Error propagation |
| **A1-005** | Compilation | Sketch compilation with FQBN | Build directory output | Compilation process |
| **A1-006** | Validation | Sketch directory validation | Directory check | Pre-compilation validation |
| **A1-007** | Upload | Sketch upload to serial port | Upload success | Deployment process |
| **A1-008** | Port Fallback | Upload without port specification | Default port used | Configuration fallback |
| **A1-009** | Sequential Commands | Three arduino-cli commands in sequence | All commands succeed | Command chaining |
| **A1-010** | Board-Specific | Platform and libraries installation | Board-specific setup | Board configuration |
| **A1-011** | Legacy Fallback | Installation without board | Legacy installation | Fallback mechanism |
| **A1-012** | Log Propagation | Log level passed to all commands | Consistent logging | Parameter propagation |

### Implementation Status: ✅ COMPLETED
- **All 12 tests converted** to interface-based dependency injection
- **Zero test interference** in full test suite runs  
- **Cross-platform compatibility** with path normalization
- **Stateless mock design** following Test-Matrix.md guidelines
- **ArduinoService refactored** with FileSystemInterface and ProcessExecutorInterface

---

## Phase 8: Config & Environment Tests

**Priority: Medium** - Configuration management and environment variable validation  
**Architecture: ✅ Clean Architecture with Dependency Injection** - **COMPLETED**

| Test ID | Category | Test Case | Expected Result | Validation Item |
|---------|----------|-----------|----------------|-----------------|
| **C1-001** | Default Config | No .env file present | Default values used | Default configuration |
| **C1-002** | Environment Override | SERIAL_PORT env variable | Environment override | Environment priority |
| **C1-003** | File Search | .env file in multiple locations | Correct file found | File discovery |
| **C1-004** | Custom Path | Custom .env file path | Custom file loaded | Path specification |
| **C1-005** | Dotenv Loading | Environment variables from .env | Variables loaded | File parsing |
| **C1-006** | Priority Order | Existing env vars vs .env file | Existing vars preferred | Priority resolution |
| **C1-007** | CLI Priority | Command-line argument override | CLI takes precedence | Argument priority |
| **C1-008** | Env Fallback | No CLI arg, SERIAL_PORT available | Environment fallback | Fallback mechanism |
| **C1-009** | Error Handling | No serial port in any source | Descriptive error | Error reporting |
| **C1-010** | Custom Path Pass | Custom .env path to loadConfig | Path correctly passed | Parameter passing |
| **C1-011** | Full Priority | CLI > env var > .env file | Priority order respected | Complete priority chain |

### Implementation Status: ✅ COMPLETED
- **All 11 tests converted** to interface-based dependency injection
- **Eliminated C1-006 test interference** with stateless MockConfigAdapter
- **ConfigService with dependency injection** using FileSystemInterface and ConfigInterface
- **100% test pass rate** in both individual and full suite runs

---

## Phase 9: End-to-End CLI Tests

**Priority: High** - Complete CLI workflow and argument parsing validation

| Test ID | Category | Test Case | Expected Result | Validation Item |
|---------|----------|-----------|----------------|-----------------|
| **E1-001** | Argument Parsing | led --on with string interval "750" | Interval converted to number 750 | Type conversion |
| **E1-002** | Complex Args | led --blink green --second-color blue --interval 250 | Multi-argument command parsing | Complex argument handling |
| **E1-003** | Required Args | led command missing --port | Descriptive error message | Port parameter validation |
| **E1-004** | Global Options | Global --log-level debug forwarded to compile | Log level propagated to subcommands | Global option forwarding |
| **E1-005** | Compile Command | compile SerialLedControl with board | Arduino compile with board config | Board-specific compilation |
| **E1-006** | Upload Command | upload LEDBlink --port COM5 | Arduino deploy with port option | Upload parameter handling |
| **E1-007** | Install Command | install command for board dependencies | Board-specific installation | Dependency management |
| **E1-008** | Board Independence | led command works without --board | Universal protocol works across boards | Board transparency |
| **E1-009** | Rainbow Command | led --rainbow --interval 100 | Rainbow with custom interval | Specialized command parsing |
| **E1-010** | Multiple Flags | led --on --off --rainbow | Multiple boolean flags handled | Boolean flag parsing |


---

## Phase 10: Arduino CLI Command Generation Tests

**Priority: High** - CLI option to Arduino CLI command transformation validation

| Test ID | Category | Input | Expected Arduino CLI Command | Validation Item |
|---------|----------|-------|------------------------------|-----------------|
| **A2-001** | Board Selection | `--board xiao-rp2040 compile LEDBlink` | `arduino-cli compile --fqbn rp2040:rp2040:seeed_xiao_rp2040 <sketch-path>` | FQBN mapping |
| **A2-002** | Port Mapping | `upload LEDBlink -p COM3` | `arduino-cli upload --port COM3 --fqbn <fqbn> <sketch-path>` | Port parameter conversion |
| **A2-003** | Log Level Debug | `--log-level debug compile LEDBlink` | `arduino-cli compile --log-level debug <args>` | Debug log level propagation |
| **A2-004** | Log Level Trace | `--log-level trace upload LEDBlink` | `arduino-cli upload --log-level trace <args>` | Trace log level propagation |
| **A2-005** | Build Directory | `compile LEDBlink` | `--build-path <workingDir>/.build/<board-id>/LEDBlink` | Build path generation |
| **A2-006** | Config File | All commands | `--config-file <workingDir>/arduino-cli.yaml` | Config file usage |
| **A2-007** | Sketch Path Resolution | `compile NeoPixel_SerialControl` | Resolves to `<packageRoot>/boards/xiao-rp2040/sketches/NeoPixel_SerialControl/NeoPixel_SerialControl.ino` | Sketch path resolution |
| **A2-008** | Multiple Boards | `--board arduino-uno-r4 compile SerialLedControl` | `arduino-cli compile --fqbn arduino:avr:uno_r4_minima <sketch-path>` | Different board FQBN mapping |
| **A2-009** | Install Command | `--board xiao-rp2040 install` | `arduino-cli core install rp2040:rp2040` and `arduino-cli lib install "Adafruit NeoPixel@1.15.1"` | Board-specific installation |
| **A2-010** | Command Sequence | `install` then `compile` then `upload` | Correct arduino-cli command sequence with proper parameters | Command chaining validation |

**Test ID Examples:**
```javascript
test('A2-001: --board xiao-rp2040 generates correct FQBN for compile', () => {});
test('A2-007: Sketch path resolution finds correct .ino file', () => {});
```

**Critical Arduino CLI Integration Areas:**
- FQBN (Fully Qualified Board Name) mapping from board IDs
- Port parameter transformation from CLI format to arduino-cli format
- Log level propagation from cc-led to arduino-cli commands
- Build directory path generation using working directory isolation
- Config file parameter injection for all arduino-cli commands

---

## Phase 12: Arduino CLI Configuration Priority Tests

**Priority: High** - Configuration file location and priority system validation

| Test ID | Category | Test Case | Expected Result | Validation Item |
|---------|----------|-----------|----------------|-----------------|
| **C2-001** | CLI Parameter | `--config-file /custom/path/config.yaml install` | Uses specified config file | Highest priority: CLI parameter |
| **C2-002** | CLI Parameter | `--config-file missing.yaml install` | Error with file not found | CLI parameter validation |
| **C2-003** | Current Directory | `install` with `./arduino-cli.yaml` present | Uses current directory config | Priority 2: Current directory |
| **C2-004** | Current Directory | `install` with malformed `./arduino-cli.yaml` | Error with config parse failure | Current directory config validation |
| **C2-005** | Package Directory | `install` without CLI arg or current dir config | Creates config in current directory | Priority 3: Package directory fallback |
| **C2-006** | Priority Order | CLI param + current dir + package configs exist | CLI parameter takes precedence | Priority hierarchy enforcement |
| **C2-007** | Config Creation | `install` in empty directory | `arduino-cli.yaml` created in working directory | Auto-generation in current directory |
| **C2-008** | Config Content | Generated config file content | Contains board manager URLs and directories | Default config content validation |
| **C2-009** | Multiple Commands | Config priority consistent across commands | Same config used for install, compile, upload | Consistency across command types |
| **C2-010** | Working Directory | Different working directories | Independent config per directory | Directory isolation |
| **C2-011** | Logging | Config file selection logged | Debug info shows selected config path | Configuration transparency |

**Test ID Examples:**
```javascript
test('C2-001: --config-file parameter overrides all other config sources', async () => {
  // Setup custom config file
  // Run command with --config-file parameter
  // Verify specified config file was used
});

test('C2-003: ./arduino-cli.yaml in current directory used when no CLI param', async () => {
  // Create arduino-cli.yaml in current directory
  // Run command without --config-file
  // Verify current directory config was used
});

test('C2-007: Config file auto-created in current directory when missing', async () => {
  // Ensure no config files exist
  // Run install command
  // Verify arduino-cli.yaml created in current directory
});
```

**Implementation Priority:**
- 🔥 **High**: C2-001, C2-003, C2-005, C2-007 (core priority logic)
- 🟡 **Medium**: C2-002, C2-004, C2-009, C2-011 (validation and logging)
- 🟢 **Low**: C2-006, C2-008, C2-010 (edge cases and content validation)

**Configuration Priority System Requirements:**
1. **CLI Parameter** (`--config-file <path>`): Explicit user specification, highest priority
2. **Current Directory** (`./arduino-cli.yaml`): Project-specific configuration 
3. **Package Directory**: Auto-generated default configuration as fallback
4. **Error Handling**: Clear error messages for missing or invalid config files
5. **Logging**: Debug-level logging of config file selection process
6. **Auto-Generation**: Default config created in current directory when no config found
- Sketch path resolution from name to actual .ino file location
- Board-specific installation commands (platform + libraries)
- Command parameter consistency across workflow sequences

---

## Phase 11: Arduino Command Processing Tests
**Priority: Critical** - Microcontroller command processing and response generation validation  
**Test Framework: Unity (ThrowTheSwitch/Unity)** for C/C++ unit testing

| Test ID | Category | Input Command | Expected Response | Validation Item |
|---------|----------|---------------|-------------------|-----------------|
| **U1-001** | Basic Commands | `"ON"` | `"ACCEPTED,ON"` | Basic ON command processing |
| **U1-002** | Basic Commands | `"OFF"` | `"ACCEPTED,OFF"` | Basic OFF command processing |
| **U1-003** | Color Commands | `"COLOR,255,0,0"` | `"ACCEPTED,COLOR,255,0,0"` | Valid RGB color processing |
| **U1-004** | Color Validation | `"COLOR,256,0,0"` | `"REJECT,COLOR,256,0,0,invalid format"` | R channel boundary violation |
| **U1-005** | Color Validation | `"COLOR,255,256,0"` | `"REJECT,COLOR,255,256,0,invalid format"` | G channel boundary violation |
| **U1-006** | Color Validation | `"COLOR,255,0,256"` | `"REJECT,COLOR,255,0,256,invalid format"` | B channel boundary violation |
| **U1-007** | Color Validation | `"COLOR,-1,0,0"` | `"REJECT,COLOR,-1,0,0,invalid format"` | Negative R channel |
| **U1-008** | Color Validation | `"COLOR,255,0"` | `"REJECT,COLOR,255,0,invalid format"` | Missing B channel |
| **U1-009** | Color Validation | `"COLOR,255,0,0,extra"` | `"REJECT,COLOR,255,0,0,extra,invalid format"` | Extra parameters |
| **U1-010** | Blink Commands | `"BLINK1,255,255,255,500"` | `"ACCEPTED,BLINK1,255,255,255,interval=500"` | Valid single-color blink |
| **U1-011** | Blink Commands | `"BLINK2,255,0,0,0,0,255,300"` | `"ACCEPTED,BLINK2,255,0,0,0,0,255,interval=300"` | Valid two-color blink |
| **U1-012** | Interval Validation | `"BLINK1,255,255,255,0"` | `"REJECT,BLINK1,255,255,255,0,invalid parameters"` | Zero interval rejection |
| **U1-013** | Interval Validation | `"BLINK1,255,255,255,-100"` | `"REJECT,BLINK1,255,255,255,-100,invalid parameters"` | Negative interval |
| **U1-014** | Rainbow Commands | `"RAINBOW,50"` | `"ACCEPTED,RAINBOW,interval=50"` | Valid rainbow command |
| **U1-015** | Rainbow Validation | `"RAINBOW,0"` | `"REJECT,RAINBOW,0,invalid interval"` | Zero interval rainbow |
| **U1-016** | Unknown Commands | `"INVALID_CMD"` | `"REJECT,INVALID_CMD,unknown command"` | Unknown command handling |
| **U1-017** | Empty Commands | `""` | `"REJECT,,unknown command"` | Empty string handling |

**Test Framework:** Unity (ThrowTheSwitch/Unity) for C/C++ microcontroller testing.
**Implementation:** Arduino-independent command processor with response generation.
**Execution:** See [CI-CD Test Strategy](CI-CD-Test-Strategy.md) for test execution methods.

---

>*Built for systematic validation of cc-led protocol implementation*