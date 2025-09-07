# CI/CD Test Strategy

## Test Execution Commands

### CI/CD Pipeline
```bash
npm run test:ci       # Run all stable tests (93 tests, ~1.3s)
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

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Total Tests** | 110 | All stable phases (93 Node.js + 17 Unity) |
| **Execution Time** | ~1.3s | Full suite |
| **Parallel Safe** | ✅ Yes | Dependency injection |
| **Coverage** | 100% | Critical paths |

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

## Package Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ci": "npm run test:stable",
    "test:stable": "vitest run test/phase1/ test/phase2/ test/phase3/ test/phase4/ test/phase5/ test/phase6/ test/phase7/ test/phase8/ test/phase9/ test/phase10/ --reporter=basic",
    "test:phase9": "vitest run test/phase9/cli-service.test.js"
  }
}
```