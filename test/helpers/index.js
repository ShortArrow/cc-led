/**
 * @fileoverview Test Helpers Index - Test-Matrix.md Compliant
 * 
 * Self-contained test utilities following Test-Matrix.md guidelines.
 * Provides simple, direct imports without complex abstractions.
 */

// Self-contained mock factories (Test-Matrix.md compliant)
export * from './serial-mock-factory.js';

// Test matrix data structure (Test-Matrix.md specification)
export * from './validation-matrix.js';

// Note: Following Test-Matrix.md principle of avoiding over-abstraction
// Each test should be self-contained with inline setup when possible