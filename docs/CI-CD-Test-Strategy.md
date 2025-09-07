# CI/CD Test Strategy

## Test Execution Commands

### CI/CD Pipeline
```bash
npm run test:ci       # Run all stable tests (121 tests, ~1.5s)
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
cd boards/common/test
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
    "test:stable": "vitest run test/phase1/ test/phase2/ test/phase3/ test/phase4/ test/phase5/ test/phase6/ test/phase7/ test/phase8/ test/phase9/ test/phase10/ test/phase11/ test/phase12/ --reporter=basic",
    "test:phase9": "vitest run test/phase9/cli-service.test.js"
  }
}
```