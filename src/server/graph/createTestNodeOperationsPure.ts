import { type GraphOperation } from '../../graph/index';
import path from 'path';

// Pure function to create test node operations
export function createTestNodeOperationsPure(
  sanitizedConfigKey: string,
  filePathForEntrypoint: string,
  individualResult: any,
  entrypointId: string | null,
  timestamp: string,
  testIndex: number
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  
  const stepName = individualResult.stepName;
  if (!stepName) {
    return operations;
  }
  
  const testId = `test:${sanitizedConfigKey}:${filePathForEntrypoint}:${testIndex}`;

  // Prepare test metadata
  const testMetadata: Record<string, unknown> = {
    configKey: sanitizedConfigKey,
    testName: filePathForEntrypoint,
    stepIndex: testIndex,
    stepName,
    failed: individualResult.failed,
    features: individualResult.features || []
  };

  // Add any additional fields from individualResult to test metadata
  Object.entries(individualResult).forEach(([key, value]) => {
    if (!['stepName', 'failed', 'features'].includes(key)) {
      testMetadata[key] = value;
    }
  });

  // Ensure result is properly set for coloring
  // If failed is explicitly set, use it to determine result
  if (individualResult.failed !== undefined) {
    // For coloring, we want:
    // failed: false -> success (0)
    // failed: true -> error (-1)
    testMetadata.result = individualResult.failed ? -1 : 0;
  } else if (individualResult.result !== undefined) {
    // Use the result field if present
    testMetadata.result = individualResult.result;
  }

  // Determine status and priority
  const status = individualResult.failed === false ? 'done' : 'blocked';
  const priority = individualResult.failed === false ? 'low' : 'high';

  // Create test node operation
  operations.push({
    type: 'addNode', // Always add, caller can handle update if needed
    data: {
      id: testId,
      type: 'test',
      label: stepName,
      description: `Test: ${stepName}`,
      status,
      priority,
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
