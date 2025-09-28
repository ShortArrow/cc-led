# 🏷️ Git Version Integration for Arduino Sketches

> **Automatic version information injection during Arduino sketch compilation**

## 📋 Overview

This system automatically injects Git version information (tags or commit hashes) into Arduino sketches during compilation. The version information is embedded as compile-time constants and accessible through the `VERSION` serial command.

## 🎯 Key Features

- **Git Tag Detection**: Uses Git tags as version numbers when available
- **Commit Hash Fallback**: Falls back to commit hash when no tags exist
- **Dirty Working Directory Detection**: Adds "-dirty" suffix for uncommitted changes
- **Build-time Injection**: Version info embedded during Arduino CLI compilation
- **Serial Access**: Available through `VERSION` serial command
- **Board-specific**: Includes board identifier in version response

## 🔧 How It Works

### 1. Version Information Extraction

The `scripts/get-version-info.js` script extracts version information:

```bash
# If on a Git tag (clean working directory)
VERSION,v1.2.3,xiao-rp2040,UniversalLedControl,2025-01-13

# If ahead of tag with uncommitted changes  
VERSION,v1.2.3-2-gabc123-dirty,xiao-rp2040,UniversalLedControl,2025-01-13

# If no tags exist
VERSION,0.0.0-gabc123,xiao-rp2040,UniversalLedControl,2025-01-13
```

### 2. Build-time Macro Injection

During Arduino CLI compilation, the following macros are defined:

```c
#define FIRMWARE_VERSION "v1.2.3"
#define FIRMWARE_COMMIT "abc123"
#define FIRMWARE_BUILD_DATE "2025-01-13"
#define FIRMWARE_BOARD "xiao-rp2040"
#define FIRMWARE_NAME "UniversalLedControl"
#define FIRMWARE_BRANCH "main"
#define FIRMWARE_IS_CLEAN 1
```

### 3. Arduino Sketch Integration

The `CommandProcessor.c` uses these macros:

```c
// VERSION command
else if (strcmp(cmd, "VERSION") == 0) {
    response->result = COMMAND_ACCEPTED;
    snprintf(response->response, sizeof(response->response), 
            "VERSION,%s,%s,%s,%s", 
            FIRMWARE_VERSION, FIRMWARE_BOARD, FIRMWARE_NAME, FIRMWARE_BUILD_DATE);
}
```

## 🚀 Usage

### Automatic Integration

Version injection happens automatically during normal build operations:

```bash
# Compile with version info
cc-led compile UniversalLedControl

# Deploy with version info  
cc-led deploy UniversalLedControl -p COM3
```

### Manual Script Usage

You can also run the version script directly:

```bash
# Get version information as JSON
node scripts/get-version-info.js --output-format=json

# Get C preprocessor defines
node scripts/get-version-info.js --output-format=defines --board=xiao-rp2040

# Get Arduino CLI build flags
node scripts/get-version-info.js --output-format=build-flags --board=arduino-uno-r4
```

### Serial Command Access

Query version information over serial:

```bash
# Send VERSION command
echo "VERSION" > /dev/ttyUSB0

# Response format
VERSION,v1.2.3,xiao-rp2040,UniversalLedControl,2025-01-13
```

## 📊 Version Format Examples

| Git State | Generated Version | Description |
|-----------|------------------|-------------|
| `v1.0.0` (clean) | `v1.0.0` | Exact tag match, clean working directory |
| `v1.0.0` + 2 commits | `v1.0.0-2-gabc123` | 2 commits ahead of tag |
| `v1.0.0` + changes | `v1.0.0-dirty` | Tag with uncommitted changes |
| No tags + commit | `0.0.0-gabc123` | No tags, using commit hash |
| No Git repo | `1.0.0-unknown` | Fallback when Git not available |

## 🏗️ Technical Implementation

### Script Architecture

```text
scripts/get-version-info.js
├── getVersionInfo()      # Extract Git information
├── generateDefines()     # Generate C preprocessor defines  
├── generateBuildFlags()  # Generate Arduino CLI build flags
└── getBoardFromSketch()  # Determine board from path
```

### Arduino CLI Integration

The `ArduinoService` class automatically adds build flags:

```javascript
const buildFlags = this.getBuildFlags(boardType);
const args = [
  'compile', 
  '--fqbn', board.fqbn,
  '--build-property', `build.extra_flags=${buildFlags}`,
  sketchPath
];
```

### Fallback Behavior

When Git information is unavailable:

1. **No Git repository**: Returns `1.0.0-unknown`
2. **Git command fails**: Uses fallback values
3. **Script execution fails**: Arduino compilation continues with defaults

## 🧪 Testing

### Version Script Tests

```bash
npm test -- test/phase16/git-version-info.test.js
```

### CommandProcessor Tests

```bash
# C unit tests (Unity framework)
cd sketches/common/test
gcc test_command_processor.c ../src/CommandProcessor.c Unity/src/unity.c -o test_runner
./test_runner
```

## 📁 File Structure

```text
cc-led/
├── scripts/
│   └── get-version-info.js           # Version extraction script
├── src/
│   └── arduino.js                    # Build flags injection
├── sketches/common/src/
│   └── CommandProcessor.c            # VERSION command handling
└── docs/
    ├── CLI-Serial-Protocol-Specification.md
    └── GIT-VERSION-INTEGRATION.md    # This document
```

## ⚠️ Important Notes

### Git Requirements

- Script requires Git repository for full functionality
- Works with any Git version that supports standard commands
- Gracefully degrades when Git is unavailable

### Arduino CLI Compatibility

- Uses `--build-property` flag supported in Arduino CLI 0.19.0+
- Compatible with all board types (XIAO RP2040, Arduino Uno R4, etc.)
- Build flags are properly escaped for shell execution

### Performance Impact

- Version extraction adds ~50ms to build time
- No runtime performance impact on Arduino sketches
- Information is embedded as compile-time constants

## 🔍 Troubleshooting

### Common Issues

1. **"Not a git repository" warning**: Normal when building outside Git repo
2. **Version shows "unknown"**: Git commands failed, using fallbacks
3. **Build flags not applied**: Check Arduino CLI version (0.19.0+ required)

### Debug Information

Enable debug logging to see version injection:

```bash
cc-led compile UniversalLedControl --log-level debug
```

## 🎯 Future Enhancements

- **Semantic Versioning**: Automatic version bumping based on commits
- **Build Metadata**: Include compiler version and build environment
- **Custom Templates**: User-configurable version format strings
- **Release Automation**: Integration with CI/CD pipelines

---

*Built with ❤️ for reproducible Arduino firmware builds*
