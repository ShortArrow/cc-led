/**
 * Shared mock adapters for Phase 12 tests
 */

export class MockFileSystemAdapter {
  constructor() {
    this.files = new Map();
    this.directories = new Set();
  }

  existsSync(path) {
    return this.files.has(path) || this.directories.has(path);
  }

  writeFileSync(path, content, encoding) {
    this.files.set(path, { content, encoding });
  }

  readFileSync(path, encoding) {
    const file = this.files.get(path);
    if (!file) {
      throw new Error(`File not found: ${path}`);
    }
    return file.content;
  }

  // Helper methods for test setup
  addFile(path, content) {
    this.files.set(path, { content, encoding: 'utf-8' });
  }

  addDirectory(path) {
    this.directories.add(path);
  }

  clear() {
    this.files.clear();
    this.directories.clear();
  }
}

export class MockProcessExecutorAdapter {
  constructor() {
    this.executedCommands = [];
    this.mockResponses = new Map();
  }

  spawn(command, args, options) {
    const fullCommand = `${command} ${args.join(' ')}`;
    this.executedCommands.push({ command, args, options, fullCommand });

    // Mock successful response
    return {
      stdout: {
        on: (event, callback) => {
          if (event === 'data') {
            const response = this.mockResponses.get(fullCommand) || 'Success\n';
            callback(Buffer.from(response));
          }
        }
      },
      stderr: {
        on: (event, callback) => {
          // Mock stderr if needed
        }
      },
      on: (event, callback) => {
        if (event === 'close') {
          callback(0); // Success exit code
        }
      }
    };
  }

  setMockResponse(command, response) {
    this.mockResponses.set(command, response);
  }

  getLastCommand() {
    return this.executedCommands[this.executedCommands.length - 1];
  }

  clear() {
    this.executedCommands.length = 0;
    this.mockResponses.clear();
  }
}