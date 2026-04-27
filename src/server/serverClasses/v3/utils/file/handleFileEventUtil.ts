import type { GraphOperation } from "../../../../../graph";
import { createDependencyEdgeType, createFileNodeType } from "../../../../../graph";

export interface FileEvent {
  filePath: string;
  eventType: 'change' | 'create' | 'delete';
}

export interface HandleFileEventResult {
  operations: GraphOperation[];
  timestamp: string;
}

/**
 * Determine the type of file based on its path.
 */
function getFileType(filePath: string): 'inputFilesJson' | 'testsJson' | 'documentation' | 'other' {
  if (filePath.endsWith('inputFiles.json')) {
    return 'inputFilesJson';
  }
  if (filePath.endsWith('tests.json')) {
    return 'testsJson';
  }
  // Documentation files: .md, .feature, .txt, .markdown
  const docExtensions = ['.md', '.feature', '.txt', '.markdown'];
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (ext && docExtensions.includes(`.${ext}`)) {
    return 'documentation';
  }
  return 'other';
}

/**
 * Generate folder node and edge operations for a given file path.
 * Returns operations to create all ancestor folder nodes and the edge
 * from the immediate parent folder to the file node.
 */
function generateFolderOperations(
  filePath: string,
  fileNodeId: string,
  timestamp: string,
): GraphOperation[] {
  const ops: GraphOperation[] = [];
  const pathParts = filePath.split('/').filter(Boolean);
  let currentPath = '';
  let parentFolderId: string | undefined;

  for (const part of pathParts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const folderNodeId = `folder:${currentPath}`;

    // Add folder node (addNode is idempotent in applyUpdate – it skips if exists)
    ops.push({
      type: 'addNode',
      data: {
        id: folderNodeId,
        type: { category: 'file', type: 'folder' },
        label: part,
        description: `Folder: ${currentPath}`,
        metadata: { path: currentPath },
      },
      timestamp,
    });

    if (parentFolderId) {
      ops.push({
        type: 'addEdge',
        data: {
          source: parentFolderId,
          target: folderNodeId,
          attributes: {
            type: { category: 'structural', type: 'contains', directed: true },
            timestamp,
          },
        },
        timestamp,
      });
    }

    parentFolderId = folderNodeId;
  }

  // Connect the file node to its immediate parent folder
  if (parentFolderId) {
    ops.push({
      type: 'addEdge',
      data: {
        source: parentFolderId,
        target: fileNodeId,
        attributes: {
          type: { category: 'structural', type: 'locatedIn', directed: true },
          timestamp,
        },
      },
      timestamp,
    });
  }

  return ops;
}

/**
 * Parse inputFiles.json content and produce operations to add file nodes.
 */
function handleInputFilesJson(
  filePath: string,
  content: string,
  timestamp: string,
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  try {
    const allTestsInfo = JSON.parse(content);
    for (const [testName, testInfo] of Object.entries(allTestsInfo)) {
      const info = testInfo as { hash?: string; files?: string[] };
      if (!info.files) continue;

      // Extract configKey from the file path: testeranto/bundles/{configKey}/inputFiles.json
      const pathParts = filePath.split('/');
      const bundlesIndex = pathParts.indexOf('bundles');
      const configKey = bundlesIndex !== -1 ? pathParts[bundlesIndex + 1] : 'unknown';

      const testNodeId = `test:${configKey}:${testName}`;

      // Create the test node
      operations.push({
        type: 'addNode',
        data: {
          id: testNodeId,
          type: { category: 'process', type: 'bdd' },
          label: testName.split('/').pop() || testName,
          description: `Test: ${testName}`,
          metadata: {
            configKey,
            testName,
            testFilePath: testName,
          },
        },
        timestamp,
      });

      for (const inputFile of info.files) {
        // Strip leading slash for consistent path handling
        const normalizedPath = inputFile.startsWith('/') ? inputFile.slice(1) : inputFile;
        const fileNodeId = `file:${normalizedPath}`;

        // Add file node
        operations.push({
          type: 'addNode',
          data: {
            id: fileNodeId,
            type: { category: 'file', type: 'inputFile' },
            label: normalizedPath.split('/').pop() || normalizedPath,
            description: `Input file: ${normalizedPath}`,
            metadata: {
              filePath: normalizedPath,
              localPath: normalizedPath,
              url: `file://${normalizedPath}`,
            },
          },
          timestamp,
        });

        // Add folder nodes and edge using generated operations
        const folderOps = generateFolderOperations(normalizedPath, fileNodeId, timestamp);
        operations.push(...folderOps);

        // Connect test node to file node
        operations.push({
          type: 'addEdge',
          data: {
            source: testNodeId,
            target: fileNodeId,
            attributes: {
              type: createDependencyEdgeType('requires'),
              timestamp,
            },
          },
          timestamp,
        });
      }
    }
  } catch (err) {
    // If parsing fails, return no operations
  }
  return operations;
}

/**
 * Parse tests.json content and produce operations to add output file node + edge.
 */
function handleTestsJson(
  filePath: string,
  content: string,
  timestamp: string,
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  try {
    const testResult = JSON.parse(content);

    // Extract configKey and testName from the file path:
    // testeranto/reports/{configKey}/{testName}/tests.json
    // The testName is the entire path between configKey and /tests.json
    const pathParts = filePath.split('/');
    const reportsIndex = pathParts.indexOf('reports');
    if (reportsIndex === -1) return operations;

    const configKey = pathParts[reportsIndex + 1];
    if (!configKey) return operations;

    // The test name is everything after configKey up to the last segment (tests.json)
    // e.g., pathParts = [..., 'reports', 'nodetests', 'src', 'lib', ..., 'Calculator.test.node.ts', 'tests.json']
    // testNameParts = ['src', 'lib', ..., 'Calculator.test.node.ts']
    const testNameParts = pathParts.slice(reportsIndex + 2, -1);
    if (testNameParts.length === 0) return operations;
    const testName = testNameParts.join('/');

    const testNodeId = `test:${configKey}:${testName}`;
    // Strip leading slash for consistent path handling
    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const outputFileNodeId = `file:${normalizedPath}`;

    // Ensure the test node exists (it should have been created by handleInputFilesJson,
    // but create it here as a fallback in case inputFiles.json wasn't processed)
    operations.push({
      type: 'addNode',
      data: {
        id: testNodeId,
        type: { category: 'process', type: 'bdd' },
        label: testName.split('/').pop() || testName,
        description: `Test: ${testName}`,
        metadata: {
          configKey,
          testName,
          testFilePath: testName,
        },
      },
      timestamp,
    });

    // Add output file node
    operations.push({
      type: 'addNode',
      data: {
        id: outputFileNodeId,
        type: createFileNodeType('outputFile'),
        label: normalizedPath.split('/').pop() || normalizedPath,
        description: `Output file: ${normalizedPath}`,
        metadata: {
          filePath: normalizedPath,
          localPath: normalizedPath,
          url: `file://${normalizedPath}`,
        },
      },
      timestamp,
    });

    // Add folder nodes and edge using generated operations
    const folderOps = generateFolderOperations(normalizedPath, outputFileNodeId, timestamp);
    operations.push(...folderOps);

    // Connect test node to output file node with "provides" edge
    operations.push({
      type: 'addEdge',
      data: {
        source: testNodeId,
        target: outputFileNodeId,
        attributes: {
          type: createDependencyEdgeType('provides'),
          timestamp,
        },
      },
      timestamp,
    });

    // Also update the test node with the test result status
    const failed = testResult.failed === true;
    operations.push({
      type: 'updateNode',
      data: {
        id: testNodeId,
        status: failed ? 'failed' : 'passed',
        metadata: {
          testResult,
          updatedAt: timestamp,
        },
      },
      timestamp,
    });
  } catch (err) {
    // If parsing fails, return no operations
  }
  return operations;
}

/**
 * Handle documentation file changes (create/update/delete).
 */
function handleDocumentationFile(
  filePath: string,
  eventType: 'change' | 'create' | 'delete',
  timestamp: string,
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  // Strip leading slash for consistent path handling
  const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const fileNodeId = `file:${normalizedPath}`;

  if (eventType === 'delete') {
    operations.push({
      type: 'removeNode',
      data: { id: fileNodeId },
      timestamp,
    });
  } else {
    // Add or update file node
    operations.push({
      type: 'addNode',
      data: {
        id: fileNodeId,
        type: { category: 'file', type: 'documentation' },
        label: normalizedPath.split('/').pop() || normalizedPath,
        description: `Documentation file: ${normalizedPath}`,
        metadata: {
          filePath: normalizedPath,
          localPath: normalizedPath,
          url: `file://${normalizedPath}`,
        },
      },
      timestamp,
    });

    // Add folder nodes and edge using generated operations
    const folderOps = generateFolderOperations(normalizedPath, fileNodeId, timestamp);
    operations.push(...folderOps);
  }

  return operations;
}

/**
 * Main handler for file events.
 * Accepts a file path and event type, determines the file type,
 * and produces the appropriate GraphOperation array.
 * If projectRoot is provided, the file path will be made relative to it.
 */
export function handleFileEventUtil(
  filePath: string,
  eventType: 'change' | 'create' | 'delete',
  content?: string,
  projectRoot?: string,
): HandleFileEventResult {
  const timestamp = new Date().toISOString();

  // Make the file path relative to the project root if provided
  let relativePath = filePath;
  if (projectRoot) {
    // Ensure projectRoot ends with a slash for proper prefix matching
    const rootWithSlash = projectRoot.endsWith('/') ? projectRoot : projectRoot + '/';
    if (relativePath.startsWith(rootWithSlash)) {
      relativePath = relativePath.slice(rootWithSlash.length);
    } else if (relativePath.startsWith(projectRoot)) {
      relativePath = relativePath.slice(projectRoot.length + 1);
    }
  } else {
    // Fallback: strip leading slash
    relativePath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  }

  const fileType = getFileType(relativePath);

  let operations: GraphOperation[] = [];

  switch (fileType) {
    case 'inputFilesJson':
      if (content !== undefined && eventType !== 'delete') {
        operations = handleInputFilesJson(relativePath, content, timestamp);
      }
      break;

    case 'testsJson':
      if (content !== undefined && eventType !== 'delete') {
        operations = handleTestsJson(relativePath, content, timestamp);
      }
      break;

    case 'documentation':
      operations = handleDocumentationFile(relativePath, eventType, timestamp);
      break;

    case 'other':
    default:
      // No operations for other file types
      break;
  }

  return {
    operations,
    timestamp,
  };
}
