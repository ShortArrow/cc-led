#!/usr/bin/env node

/**
 * @fileoverview CLI Runner - Production entry point
 * 
 * Creates CLIService with production dependencies and runs CLI
 */

import { CLIService } from './cli-service.js';
import { executeCommand } from './controller.js';
import { compile, deploy, install } from './arduino.js';
import { BoardLoader } from './boards/board-loader.js';
import { getSerialPort } from './utils/config.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Production dependencies
const dependencies = {
  controller: { executeCommand },
  arduino: { compile, deploy, install },
  boardLoader: new BoardLoader(),
  config: { getSerialPort },
  fileSystem: { readFileSync }
};

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

// CLI options
const options = {
  packageInfo: {
    name: packageJson.name || 'cc-led',
    version: packageJson.version || '1.0.0'
  },
  exitHandler: process.exit,
  consoleHandler: console
};

// Create and run CLI service
const cliService = new CLIService(dependencies, options);
await cliService.parse(process.argv);