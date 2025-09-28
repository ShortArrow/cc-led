import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules
vi.mock('child_process');
vi.mock('fs');

/**
 * Phase 13: MCP Integration Tests - Version Management
 * Test ID: M1-021 to M1-025
 * 
 * Validates MCP getVersion method for both server and hardware version retrieval
 */
describe('M1-021 to M1-025: MCP Version Management Integration', () => {
  let GetVersionUseCase;
  let getVersionUseCase;
  let mockLedController;
  let mockExecSync;
  let mockReadFileSync;

  beforeEach(async () => {
    // Clear any existing mocks
    vi.clearAllMocks();
    vi.resetAllMocks();
    
    // Import modules after mocking
    const { GetVersionUseCase: ImportedGetVersionUseCase } = await import('../../src/application/mcp/use-cases/get-version.use-case.js');
    const { execSync } = await import('child_process');
    const { readFileSync } = await import('fs');
    
    GetVersionUseCase = ImportedGetVersionUseCase;
    mockExecSync = vi.mocked(execSync);
    mockReadFileSync = vi.mocked(readFileSync);
    
    // Create completely fresh mock object for each test
    mockLedController = {
      getHardwareVersion: vi.fn()
    };
    
    // Create new use case instance with fresh mock
    getVersionUseCase = new GetVersionUseCase(mockLedController);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it('M1-021: should retrieve server version with git information', async () => {
    const mockPackageJson = {
      name: 'cc-led',
      version: '0.0.5-pre'
    };
    
    mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
    mockExecSync
      .mockReturnValueOnce('82a28ec123456789abcdef') // git rev-parse HEAD
      .mockReturnValueOnce('2025-01-13 16:00:00 +0900') // git log
      .mockReturnValueOnce('feature/mcp-integration'); // git branch

    const result = await getVersionUseCase.execute({ target: 'server' });

    expect(result).toEqual({
      name: 'cc-led-mcp-server',
      version: '0.0.5-pre',
      packageVersion: '0.0.5-pre',
      commitHash: '82a28ec123456789abcdef',
      shortHash: '82a28ec',
      commitDate: '2025-01-13 16:00:00 +0900',
      branch: 'feature/mcp-integration'
    });
  });

  it('M1-023: should handle hardware communication failure', async () => {
    mockLedController.getHardwareVersion.mockRejectedValue(
      new Error('Serial port not available')
    );

    const result = await getVersionUseCase.execute({ target: 'hardware' });

    expect(result).toEqual({
      name: 'Arduino LED Controller',
      version: 'unknown',
      board: 'unknown',
      firmware: 'unknown',
      buildDate: 'unknown',
      error: 'Serial port not available'
    });
  });

  it('M1-022: should retrieve hardware version successfully', async () => {
    const mockHardwareVersion = {
      version: '1.0.0',
      board: 'xiao-rp2040',
      firmware: 'UniversalLedControl',
      buildDate: '2025-01-13'
    };
    
    mockLedController.getHardwareVersion.mockResolvedValue(mockHardwareVersion);
    
    const result = await getVersionUseCase.execute({ target: 'hardware' });

    expect(result).toEqual({
      name: 'Arduino LED Controller',
      version: '1.0.0',
      board: 'xiao-rp2040',
      firmware: 'UniversalLedControl',
      buildDate: '2025-01-13'
    });
    
    // Verify success by checking no error field is present
    expect(result.error).toBeUndefined();
  });

  it('M1-024: should default to server target when not specified', async () => {
    const mockPackageJson = { name: 'cc-led', version: '1.0.0' };
    mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
    mockExecSync.mockReturnValue('');

    const result = await getVersionUseCase.execute({});

    expect(result.name).toBe('cc-led-mcp-server');
    expect(result.version).toBe('1.0.0');
  });

  it('M1-025: should throw error for unknown target', async () => {
    await expect(getVersionUseCase.execute({ target: 'invalid' }))
      .rejects.toThrow('Unknown version target: invalid');
  });
});