import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class GetVersionUseCase {
  #ledController;

  constructor(ledController) {
    this.#ledController = ledController;
  }

  async execute({ target = 'server' }) {
    switch (target) {
      case 'server':
        return this.#getServerVersion();
      case 'hardware':
        return this.#getHardwareVersion();
      default:
        throw new Error(`Unknown version target: ${target}`);
    }
  }

  #getServerVersion() {
    const result = {
      name: 'cc-led-mcp-server',
      version: null,
      commitHash: null,
      commitDate: null,
      branch: null,
      packageVersion: null
    };

    try {
      // Get package.json version
      const packagePath = join(__dirname, '..', '..', '..', '..', 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
      result.packageVersion = packageJson.version;
      result.version = packageJson.version;

      // Get git info
      try {
        result.commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
        result.commitDate = execSync('git log -1 --format=%cd --date=iso', { encoding: 'utf-8' }).trim();
        result.branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
        
        // Short commit hash for display
        result.shortHash = result.commitHash.substring(0, 7);
      } catch (gitError) {
        // Git commands failed, but we still have package version
        console.error('Git info not available:', gitError.message);
      }
    } catch (error) {
      throw new Error(`Failed to get server version: ${error.message}`);
    }

    return result;
  }

  async #getHardwareVersion() {
    // Send VERSION command to hardware and get response
    try {
      const response = await this.#ledController.getHardwareVersion();
      
      return {
        name: 'Arduino LED Controller',
        version: response.version || 'unknown',
        board: response.board || 'unknown',
        firmware: response.firmware || 'unknown',
        buildDate: response.buildDate || 'unknown'
      };
    } catch (error) {
      return {
        name: 'Arduino LED Controller',
        version: 'unknown',
        board: 'unknown', 
        firmware: 'unknown',
        buildDate: 'unknown',
        error: error.message
      };
    }
  }
}