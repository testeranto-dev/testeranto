import { type GraphOperation } from '../../graph/index';
import path from 'path';

// Pure function to create test node operations from simple test results
export function createSimpleTestNodeOperationsPure(
  sanitizedConfigKey: string,
  filePathForEntrypoint: string,
  testResults: any,
  entrypointId: string | null,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  
  const testId = `test:${sanitizedConfigKey}:${filePathForEntrypoint}:0`;

  // Prepare test metadata from testResults
  const testMetadata: Record<string, unknown> = {
    ...testResults,
    configKey: sanitizedConfigKey,
    testName: filePathForEntrypoint
  };

  // Ensure result is properly set for coloring
  if (testResults.failed !== undefined) {
    testMetadata.result = testResults.failed ? -1 : 0;
  }

  // Create test node operation
  operations.push({
    type: 'addNode',
    data: {
      id: testId,
      type: 'test',
      label: path.basename(filePathForEntrypoint),
      description: `Test: ${filePathForEntrypoint}`,
      status: testResults.failed === false ? 'done' : 'blocked',
      priority: testResults.failed === false ? 'low' : 'high',
      icon: 'test',
      metadata: testMetadata
    },
    timestamp
  });

  // Connect test to entrypoint if we have one
  if (entrypointId) {
    operations.push({
      type: 'addEdge',
      data: {
        source: entrypointId,
        target: testId,
        attributes: {
          type: 'belongsTo',
          weight: 1
        }
      },
      timestamp
    });
  }

  return operations;
}
