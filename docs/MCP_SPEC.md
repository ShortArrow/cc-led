# MCP (Model Context Protocol) Functional Specification

## 1. Overview

Add MCP server functionality to cc-led, enabling Arduino LED control from external AI applications.

## 2. Requirements

### 2.1 Functional Requirements

- Operate as an MCP server and accept external connections
- Expose LED control commands via MCP
- Support switching between WebSocket and stdio communication
- Provide control by LED number with port number abstraction
- Configuration management through environment variables

### 2.2 Non-Functional Requirements

- Comply with Clean Architecture
- Comply with DDD (Domain Driven Design)
- Implementation using TDD (Test Driven Development)
- Separation from existing Arduino LED control functionality

## 3. Architecture Design

### 3.1 Directory Structure

```text
src/
├── domain/              # Domain layer
│   └── mcp/
│       ├── entities/
│       │   ├── led-device.entity.js      # LED abstraction entity
│       │   ├── mcp-server.entity.js      # MCP server entity
│       │   └── mcp-message.entity.js     # MCP message entity
│       └── value-objects/
│           ├── led-identifier.vo.js      # LED identifier (number)
│           ├── led-state.vo.js           # LED state
│           └── protocol-version.vo.js    # Protocol version
│
├── application/         # Application layer
│   └── mcp/
│       ├── use-cases/
│       │   ├── control-led.use-case.js           # LED control
│       │   ├── get-led-status.use-case.js        # LED status retrieval
│       │   └── list-available-leds.use-case.js   # Available LED list
│       └── services/
│           ├── led-mapping.service.js            # LED number to port mapping
│           └── mcp-request-handler.service.js    # MCP request processing
│
├── interfaces/          # Interface layer
│   ├── mcp-server.interface.js          # MCP server interface
│   ├── mcp-transport.interface.js       # Communication method interface
│   └── led-controller.interface.js      # LED controller interface
│
├── adapters/           # Adapter layer
│   ├── mcp-websocket.adapter.js        # WebSocket implementation
│   ├── mcp-stdio.adapter.js            # stdio implementation
│   └── arduino-led.adapter.js          # Connection to existing Arduino control
│
├── infrastructure/     # Infrastructure layer
│   └── mcp/
│       ├── mcp-server-factory.js       # Server factory
│       ├── websocket-server.js         # WebSocket server implementation
│       └── stdio-server.js             # stdio server implementation
│
└── presentation/       # Presentation layer
    └── mcp/
        ├── mcp-cli-commands.js         # MCP server startup commands
        └── mcp-config-loader.js        # Environment variable configuration loader
```

### 3.2 Layer Responsibilities

#### Domain Layer

- LED control business logic
- MCP message structure definition
- Abstraction by LED number

#### Application Layer

- Use case implementation
- LED number to port number mapping management
- MCP request processing flow

#### Interface Layer

- Contract definition between layers
- Realizing dependency inversion principle

#### Adapter Layer

- Specific communication implementation
- Connection to existing systems

#### Infrastructure Layer

- Server implementation details
- External library usage

#### Presentation Layer

- CLI command provision
- Configuration loading and validation

## 4. MCP Protocol Specification

### 4.1 Exposed Methods

#### controlLed

Perform LED control

```json
{
  "method": "controlLed",
  "params": {
    "ledNumber": 1,
    "action": "on" | "off" | "blink" | "rainbow",
    "color": "#FF0000",    // Optional
    "brightness": 100,     // 0-100, Optional
    "interval": 500        // 50-5000ms, Optional (for blink/rainbow)
  }
}
```

#### getLedStatus

Retrieve LED status

```json
{
  "method": "getLedStatus",
  "params": {
    "ledNumber": 1
  }
}
```

#### listAvailableLeds

Retrieve list of available LEDs

```json
{
  "method": "listAvailableLeds"
}
```

#### getVersion

Retrieve system version information

```json
{
  "method": "getVersion",
  "params": {
    "target": "server" | "hardware"  // Optional, default: "server"
  }
}
```

Response example (server):

```json
{
  "name": "cc-led-mcp-server",
  "version": "0.0.5-pre",
  "packageVersion": "0.0.5-pre",
  "commitHash": "82a28ec...",
  "shortHash": "82a28ec",
  "commitDate": "2025-01-13T16:00:00Z",
  "branch": "feature/mcp-integration"
}
```

Response example (hardware):

```json
{
  "name": "Arduino LED Controller",
  "version": "1.0.0",
  "board": "xiao-rp2040",
  "firmware": "UniversalLedControl",
  "buildDate": "2025-01-13"
}
```

### 4.2 Environment Variable Configuration

```env
# MCP configuration
MCP_TRANSPORT=websocket  # websocket | stdio
MCP_WEBSOCKET_PORT=8080
MCP_LOG_LEVEL=info

# LED mapping configuration
LED_1_PORT=/dev/ttyUSB0
LED_1_NAME=Main LED
LED_2_PORT=/dev/ttyUSB1
LED_2_NAME=Secondary LED
```

## 5. Testing Strategy

### 5.1 Unit Tests

- Business logic of each entity
- Use case behavior
- Mapping service accuracy

### 5.2 Integration Tests

- MCP message transmission and reception
- LED control execution
- Communication method switching

### 5.3 E2E Tests

- External client connections
- LED control command execution
- Error handling

## 6. Implementation Phases

### Phase 1: Foundation Building

1. Domain layer entity implementation
2. Interface definition
3. Basic unit tests

### Phase 2: Core Functionality

1. Application layer use case implementation
2. LED mapping service
3. Integration tests

### Phase 3: Communication Implementation

1. WebSocket adapter
2. stdio adapter
3. Server implementation

### Phase 4: Integration

1. Connection to existing systems
2. CLI command addition
3. E2E tests

## 7. Security Considerations

- Avoid direct exposure of port numbers
- Abstraction by LED number
- Externalization of configuration through environment variables
- Input value validation and sanitization

## 8. Compatibility

- No impact on existing cc-led functionality
- Added as optional feature
- Maintain backward compatibility
