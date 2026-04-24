import path from 'path';
import type { GraphOperation } from '../../../graph';

export function createEntrypointNodeOperationsPure(
  configKey: string,
  sanitizedConfigKey: string,
  testName: string,
  testResults: any,
  timestamp: string
): {
  entrypointId: string;
  filePathForEntrypoint: string;
  operations: GraphOperation[];
} {
  const operations: GraphOperation[] = [];

  // Check if testName looks like a file path (has extension or contains slashes)
  let entrypointId: string;
  let filePathForEntrypoint: string;

  if (testName.includes('.') || testName.includes('/') || testName.includes('\\')) {
    filePathForEntrypoint = testName;
    entrypointId = `entrypoint:${testName}`;
  } else {
    // testName doesn't look like a file path, use configKey:testName
    filePathForEntrypoint = `${configKey}:${testName}`;
    entrypointId = `entrypoint:${configKey}:${testName}`;
  }

  // Prepare entrypoint metadata
  const entrypointMetadata: Record<string, unknown> = {
    configKey,
    filePath: filePathForEntrypoint,
    timestamp: new Date().toISOString()
  };

  // Add any additional test result data to metadata, but not as separate nodes
  Object.entries(testResults).forEach(([key, value]) => {
    if (!['configKey', 'runtime', 'testName', 'individualResults', 'metadata', 'failed'].includes(key)) {
      entrypointMetadata[key] = value;
    }
  });

  // Always create the entrypoint node operation
  operations.push({
    type: 'addNode', // Caller can change to 'updateNode' if needed
    data: {
      id: entrypointId,
      type: 'entrypoint',
      label: path.basename(filePathForEntrypoint),
      description: `Test entrypoint: ${filePathForEntrypoint}`,
      status: 'done',
      icon: 'file-text',
      metadata: entrypointMetadata
    },
    timestamp
  });

  return {
    entrypointId,
    filePathForEntrypoint,
    operations
  };
}
