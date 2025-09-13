# CI/CD Test Strategy

## Test Execution Commands

### CI/CD Pipeline

```bash
npm run test:ci       # Run all stable tests (135+ tests, ~2.0s)
npm run test:coverage # Generate coverage report
```

### Development

```bash
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:fast    # Quick run with basic reporter
```

### Individual Phases

```bash
npm run test:phase9  # Phase 9 tests only
npm test -- phase11  # Phase 11 Unity tests only  
npm test -- phase12  # Phase 12 configuration priority tests only
```

### Unity Tests (Phase 11)

```bash
# Arduino Command Processing Tests (C/C++ Unity framework)

# Option 1: Native testing (gcc/g++ only, no PlatformIO required)
cd sketches/common/test
make clean && make test

# Option 2: PlatformIO testing (requires: pip install platformio)
platformio test -e native       # Host machine testing
platformio test -e arduino_uno_r4  # Hardware testing (Arduino connected)
```

### Phase 12 Tests (Configuration Priority)

```bash
# Arduino CLI Configuration Priority Tests (split into functional files)
npm test -- test/phase12/cli-parameter-priority.test.js      # CLI parameter tests
npm test -- test/phase12/current-directory-priority.test.js  # Current directory tests
npm test -- test/phase12/config-auto-generation.test.js      # Auto-generation tests
npm test -- test/phase12/config-consistency.test.js          # Multi-command consistency
npm test -- test/phase12/config-logging.test.js              # Debug logging tests
```

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Total Tests** | 121 | All stable phases (104 Node.js + 17 Unity) |
| **Execution Time** | ~1.5s | Full suite |
| **Parallel Safe** | ✅ Yes | Dependency injection |
| **Coverage** | 100% | Critical paths |
| **Test Structure** | ✅ File-based | Following Test-Matrix.md guidelines |

## GitHub Actions Configuration

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run test:ci
```

## GitLab CI Configuration

```yaml
test:
  script:
    - npm ci
    - npm run test:ci
  coverage: '/Coverage: ([0-9.]+)%/'
```

## Environment Variables

```bash
# Optional .env configuration
SERIAL_PORT=COM3    # Default serial port
LOG_LEVEL=info      # Logging level
```

## MCP Integration Testing

### MCP Test Execution

```bash
# MCP server functionality tests
npm test -- test/application/mcp/              # All MCP tests
npm test -- mcp-command-conversion-simple      # Command conversion tests
npm test -- get-version.use-case              # Version retrieval tests
npm test -- control-led.use-case              # LED control use case tests
```

### MCP Server Testing

```bash
# Manual MCP server testing
node mcp-server-stdio.js                      # Start MCP server

# MCP server validation (separate terminal)
echo '{"method":"tools/list","id":1}' | node mcp-server-stdio.js
```

### MCP Integration Validation

```bash
# Claude Desktop integration test
# 1. Update claude_desktop_config.json with current path
# 2. Restart Claude Desktop  
# 3. Test MCP commands in Claude interface
```

### MCP Test Categories

| Category | Test Files | Purpose |
|----------|------------|---------|
| **Use Cases** | `test/application/mcp/control-led.use-case.test.js` | LED control business logic |
| **Use Cases** | `test/application/mcp/get-version.use-case.test.js` | Version retrieval logic |
| **Use Cases** | `test/application/mcp/list-available-leds.use-case.test.js` | LED discovery logic |
| **Services** | `test/application/mcp/mcp-request-handler.service.test.js` | MCP protocol handling |
| **Conversion** | `test/application/mcp/mcp-command-conversion-simple.test.js` | Command transformation |
| **Domain** | `test/domain/mcp/led-*.test.js` | Domain entity validation |

### MCP Test Requirements

**Environment Setup:**

```bash
# MCP testing requires
LED_1_PORT=COM4       # Test LED port
LED_1_NAME=RGB LED    # Test LED name
MCP_TRANSPORT=stdio   # Transport protocol
```

**Test Validation Points:**

- ✅ **Protocol Compliance**: MCP 2025-06-18 specification adherence
- ✅ **Command Conversion**: #RRGGBB → R,G,B color transformation  
- ✅ **Error Handling**: Proper MCP error codes and timeout management
- ✅ **Integration**: Real LedController → Arduino hardware communication
- ✅ **Version Management**: Git commit hash and package version retrieval

**Coverage Targets:**

- Use Cases: >95% line coverage
- Services: >90% line coverage  
- Command Conversion: 100% test cases (24/24 passing)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Parallel test failures** | All tests use dependency injection |
| **Windows path issues** | Paths are normalized automatically |
| **Serial port errors** | Mock adapters handle port simulation |
| **Test file organization** | Follow Test-Matrix.md file separation guidelines |
| **Phase 12 test failures** | Use individual test file mocks, not shared state |

## Package Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ci": "npm run test:stable",
    "test:stable": "vitest run test/phase1/ test/phase2/ test/phase3/ test/phase4/ test/phase5/ test/phase6/ test/phase7/ test/phase8/ test/phase9/ test/phase10/ test/phase11/ test/phase12/ test/application/mcp/ --reporter=basic",
    "test:phase9": "vitest run test/phase9/cli-service.test.js"
  }
}
```
