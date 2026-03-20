// Framework converter interface
export interface FrameworkConverter {
  name: string;
  detect(filePath: string): boolean;
  generateWrapper(
    entryPointPath: string, 
    detectionResult: any, 
    translationResult: any, 
    filesHash: string
  ): string;
  translateToTesteranto(detectionResult: any): any;
}

// Export all converters
export * from './jest.js';
export * from './mocha.js';
export * from './vitest.js';
export * from './jasmine.js';
export * from './generic.js';
