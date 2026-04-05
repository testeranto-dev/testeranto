import { type GraphEdgeAttributes, type GraphNodeAttributes, type GraphOperation, type GraphUpdate, type TesterantoGraph } from '../../graph/index';
import type { TestResult } from "../types/testResults";
import { connectAllTestsToEntrypointPure } from './connectAllTestsToEntrypointPure';
import { createEntrypointNodeOperationsPure } from './createEntrypointNodeOperationsPure';
import { createFeatureNodeOperationsPure } from './createFeatureNodeOperationsPure';
import { createFolderNodesAndEdgesPure } from './createFolderNodesAndEdgesPure';
import { createSimpleTestNodeOperationsPure } from './createSimpleTestNodeOperationsPure';
import { createTestNodeOperationsPure } from './createTestNodeOperationsPure';
import { extractFeatureInfoPure } from './extractFeatureInfoPure';
import { processFeatureUrlPure } from './processFeatureUrlPure';

// Helper function to process features for a test
async function processFeaturesForTest(
  features: string[],
  testId: string,
  operations: GraphOperation[],
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>,
  timestamp: string
): Promise<void> {
  console.log(`[GraphManager] processFeaturesForTest called with ${features.length} features for testId ${testId}`);
  
  for (const featureUrl of features) {
    console.log(`[GraphManager] Processing feature: ${featureUrl}`);
    
    // Process the feature URL
    const { content, localPath } = await processFeatureUrlPure(
      featureUrl,
      projectRoot,
      featureIngestor
    );

    console.log(`[GraphManager] Processed feature URL, content length: ${content.length}, localPath: ${localPath}`);

    // Use pure function to create feature node operations
    const featureOps = createFeatureNodeOperationsPure(
      featureUrl,
      content,
      localPath,
      testId,
      timestamp
    );

    console.log(`[GraphManager] Created ${featureOps.length} feature operations`);

    const { featureId } = extractFeatureInfoPure(featureUrl);
    const existingFeatureNode = graph.hasNode(featureId);

    console.log(`[GraphManager] Feature ID: ${featureId}, exists in graph: ${existingFeatureNode}`);

    // Add feature operations to the main list
    for (const op of featureOps) {
      console.log(`[GraphManager] Processing feature operation: ${op.type} for ${featureId}`);
      // If node already exists and operation is 'addNode', change it to 'updateNode'
      if (op.type === 'addNode' && existingFeatureNode) {
        operations.push({
          type: 'updateNode',
          data: op.data,
          timestamp: op.timestamp
        });
        console.log(`[GraphManager] Changed addNode to updateNode for existing feature ${featureId}`);
      } else {
        operations.push(op);
        console.log(`[GraphManager] Added ${op.type} operation for ${featureId}`);
      }
    }

    // Only create edge if we have a valid testId
    if (testId) {
      // Check if edge already exists and skip if it does
      let featureEdgeExists = false;
      if (graph.hasEdge(featureId, testId)) {
        featureEdgeExists = true;
      }
      console.log(`[GraphManager] Edge from ${featureId} to ${testId} exists: ${featureEdgeExists}`);
      
      // If edge exists, we need to remove the edge operation that was added by createFeatureNodeOperationsPure
      if (featureEdgeExists) {
        // Find and remove the edge operation
        const edgeOpIndex = operations.findIndex(op =>
          op.type === 'addEdge' &&
          op.data.source === featureId &&
          op.data.target === testId
        );
        if (edgeOpIndex !== -1) {
          operations.splice(edgeOpIndex, 1);
          console.log(`[GraphManager] Removed duplicate edge operation from ${featureId} to ${testId}`);
        }
      }
    }

    // Always create folder nodes for both URLs and local file paths
    // Create folder nodes for the feature's path and connect them
    const parentFolderId = createFolderNodesAndEdgesPure(
      featureUrl,
      projectRoot,
      operations,
      timestamp
    );

    console.log(`[GraphManager] Parent folder ID for feature ${featureId}: ${parentFolderId}`);

    // Connect feature to its immediate parent folder
    if (parentFolderId !== '') {
      // Check if edge already exists
      let folderEdgeExists = false;
      if (graph.hasEdge(parentFolderId, featureId)) {
        folderEdgeExists = true;
      }

      console.log(`[GraphManager] Edge from folder ${parentFolderId} to feature ${featureId} exists: ${folderEdgeExists}`);

      if (!folderEdgeExists) {
        operations.push({
          type: 'addEdge',
          data: {
            source: parentFolderId,
            target: featureId,
            attributes: {
              type: 'locatedIn',
              weight: 1
            }
          },
          timestamp
        });
        console.log(`[GraphManager] Added edge from folder ${parentFolderId} to feature ${featureId}`);
      }
    }
  }
}

// Pure function to create graph update from test results
export async function updateFromTestResultsPure(
  testResults: TestResult | TestResult[],
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>,
  config?: any
): Promise<GraphUpdate> {
  const operations: GraphOperation[] = [];
  const timestamp = new Date().toISOString();

  // Handle array of test results
  if (Array.isArray(testResults)) {
    console.log(`[GraphManager] updateFromTestResults called with array of ${testResults.length} test results`);
    const allOps: GraphOperation[] = [];
    for (const singleResult of testResults) {
      const update = await updateFromTestResultsPure(
        singleResult,
        graph,
        projectRoot,
        featureIngestor,
        config
      );
      allOps.push(...update.operations);
    }
    return {
      operations: allOps,
      timestamp
    };
  }

  // Now testResults is a single TestResult
  const singleTestResult = testResults;

  console.log(`[GraphManager] updateFromTestResults called with:`, {
    configKey: singleTestResult.configKey,
    testName: singleTestResult.testName,
    hasMetadata: !!singleTestResult.metadata,
    keys: Object.keys(singleTestResult),
    hasIndividualResults: !!singleTestResult.individualResults,
    individualResultsType: typeof singleTestResult.individualResults,
    individualResultsLength: Array.isArray(singleTestResult.individualResults) ? singleTestResult.individualResults.length : 'not array',
    failedDefined: singleTestResult.failed !== undefined,
    hasFeatures: !!singleTestResult.features,
    featuresType: typeof singleTestResult.features,
    featuresLength: Array.isArray(singleTestResult.features) ? singleTestResult.features.length : 'not array',
    // Log individual results features if they exist
    individualResultsFeatures: singleTestResult.individualResults && Array.isArray(singleTestResult.individualResults) 
      ? singleTestResult.individualResults.map((ir: any, idx: number) => ({
          index: idx,
          stepName: ir.stepName,
          hasFeatures: !!ir.features,
          featuresCount: Array.isArray(ir.features) ? ir.features.length : 0,
          features: ir.features
        }))
      : 'no individual results'
  });
  // Debug: log full test result (truncated)
  const resultStr = JSON.stringify(singleTestResult);
  console.log(`[GraphManager] Full test result (first 500 chars):`, resultStr.substring(0, 500));

  // Extract test information - according to SOUL.md, no fallbacks
  // Use configKey only - runtime field is deprecated and should not be used
  const configKey = singleTestResult.configKey;
  const testName = singleTestResult.testName;

  // If configKey or testName are not provided, return early
  if (!configKey || !testName) {
    console.log(`[GraphManager] configKey or testName not provided, skipping test results`);
    return {
      operations: [],
      timestamp
    };
  }

  console.log(`[GraphManager] Using configKey="${configKey}", testName="${testName}"`);

  // Sanitize configKey to create valid node IDs
  const sanitizedConfigKey = configKey.replace(/[^a-zA-Z0-9:_\-.]/g, '_');
  console.log(`[GraphManager] Sanitized configKey="${sanitizedConfigKey}"`);

  // Use pure function to create entrypoint node operations
  const entrypointResult = createEntrypointNodeOperationsPure(
    configKey,
    sanitizedConfigKey,
    testName,
    singleTestResult,
    timestamp
  );

  const { entrypointId, filePathForEntrypoint, operations: entrypointOps } = entrypointResult;

  console.log(`[GraphManager] Using filePathForEntrypoint="${filePathForEntrypoint}", entrypointId="${entrypointId}"`);

  // Only create entrypoint node if we have an entrypointId
  if (entrypointId) {
    // Check if entrypoint node already exists
    const existingEntrypointNode = graph.hasNode(entrypointId);

    // Add entrypoint operations to the main list
    for (const op of entrypointOps) {
      // If node already exists and operation is 'addNode', change it to 'updateNode'
      if (op.type === 'addNode' && existingEntrypointNode) {
        operations.push({
          type: 'updateNode',
          data: op.data,
          timestamp: op.timestamp
        });
      } else {
        operations.push(op);
      }
    }

    // Create folder nodes for the entrypoint's path and connect them
    const parentFolderId = createFolderNodesAndEdgesPure(
      filePathForEntrypoint,
      projectRoot,
      operations,
      timestamp
    );

    // Connect entrypoint to its immediate parent folder
    if (parentFolderId !== '') {
      // Check if edge already exists
      let folderEdgeExists = false;
      if (graph.hasEdge(parentFolderId, entrypointId)) {
        folderEdgeExists = true;
      }

      if (!folderEdgeExists) {
        operations.push({
          type: 'addEdge',
          data: {
            source: parentFolderId,
            target: entrypointId,
            attributes: {
              type: 'locatedIn',
              weight: 1
            }
          },
          timestamp
        });
      }
    }
  }

  // Handle individual test results (from tests.json format)
  // Only create test nodes if we have a valid entrypoint
  if (entrypointId && singleTestResult.individualResults && Array.isArray(singleTestResult.individualResults)) {
    // If individualResults is empty, do not create placeholder test nodes.
    // According to SOUL.md: no fallbacks.
    if (singleTestResult.individualResults.length > 0) {
      // Process each individual result
      for (let i = 0; i < singleTestResult.individualResults.length; i++) {
        const individualResult = singleTestResult.individualResults[i];
        const stepName = individualResult.stepName;
        if (!stepName) {
          console.log(`[GraphManager] individualResult missing stepName, skipping`);
          continue;
        }

        // Use pure function to create test node operations
        const testOps = createTestNodeOperationsPure(
          sanitizedConfigKey,
          filePathForEntrypoint,
          individualResult,
          entrypointId,
          timestamp,
          i
        );

        // Check if test node already exists to determine if we should use 'updateNode' instead of 'addNode'
        const testId = `test:${sanitizedConfigKey}:${filePathForEntrypoint}:${i}`;
        const existingTestNode = graph.hasNode(testId);

        // Add operations to the main list
        for (const op of testOps) {
          // If node already exists and operation is 'addNode', change it to 'updateNode'
          if (op.type === 'addNode' && existingTestNode) {
            operations.push({
              type: 'updateNode',
              data: op.data,
              timestamp: op.timestamp
            });
          } else {
            operations.push(op);
          }
        }

        // Check if edge already exists and skip if it does
        if (entrypointId) {
          let edgeExists = false;
          if (graph.hasEdge(entrypointId, testId)) {
            edgeExists = true;
          }
          // If edge exists, we need to remove the edge operation that was added by createTestNodeOperationsPure
          if (edgeExists) {
            // Find and remove the edge operation
            const edgeOpIndex = operations.findIndex(op =>
              op.type === 'addEdge' &&
              op.data.source === entrypointId &&
              op.data.target === testId
            );
            if (edgeOpIndex !== -1) {
              operations.splice(edgeOpIndex, 1);
            }
          }
        }

        // Process features if they exist in individualResult
        // Always process features even if we don't have an entrypointId
        if (individualResult.features && Array.isArray(individualResult.features)) {
          console.log(`[GraphManager] Processing ${individualResult.features.length} features for individual result ${i}:`, individualResult.features);
          await processFeaturesForTest(
            individualResult.features,
            testId,
            operations,
            graph,
            projectRoot,
            featureIngestor,
            timestamp
          );
        } else {
          console.log(`[GraphManager] No features found for individual result ${i}`);
        }
      }
    } else {
      console.log(`[GraphManager] individualResults array is empty, creating a single placeholder test node`);
      // Create a single placeholder test node (not duplicating entrypoint label)
      const placeholderTestOps = createSimpleTestNodeOperationsPure(
        sanitizedConfigKey,
        filePathForEntrypoint,
        {
          ...singleTestResult,
          failed: singleTestResult.failed !== undefined ? singleTestResult.failed : false,
        },
        entrypointId,
        timestamp
      );
      // Override the label in the operations
      for (const op of placeholderTestOps) {
        if (op.type === 'addNode' && op.data.type === 'test') {
          op.data.label = 'Test suite';
          op.data.description = `Test suite: ${filePathForEntrypoint}`;
        }
        operations.push(op);
      }
    }
  }

  // Also process features at the top level of the test result if they exist
  // Some test formats may have features directly in the test result
  // Always process features even if we don't have an entrypointId
  if (singleTestResult.features && Array.isArray(singleTestResult.features)) {
    console.log(`[GraphManager] Processing top-level features for test ${singleTestResult.testName}`);
    console.log(`[GraphManager] Found ${singleTestResult.features.length} features:`, singleTestResult.features);
    // Create a test ID for top-level features (use index 0)
    const testId = `test:${sanitizedConfigKey}:${filePathForEntrypoint}:0`;
    console.log(`[GraphManager] Using testId ${testId} for top-level features`);
    await processFeaturesForTest(
      singleTestResult.features,
      testId,
      operations,
      graph,
      projectRoot,
      featureIngestor,
      timestamp
    );
  } else {
    console.log(`[GraphManager] No top-level features found for test ${singleTestResult.testName}`);
  }

  // Handle simple test result format
  // Only create test nodes if we have a valid entrypoint
  if (entrypointId && singleTestResult.failed !== undefined) {
    // Use pure function to create test node operations
    const simpleTestOps = createSimpleTestNodeOperationsPure(
      sanitizedConfigKey,
      filePathForEntrypoint,
      singleTestResult,
      entrypointId,
      timestamp
    );

    const testId = `test:${sanitizedConfigKey}:${filePathForEntrypoint}:0`;
    const existingTestNode = graph.hasNode(testId);

    // Add operations to the main list
    for (const op of simpleTestOps) {
      // If node already exists and operation is 'addNode', change it to 'updateNode'
      if (op.type === 'addNode' && existingTestNode) {
        operations.push({
          type: 'updateNode',
          data: op.data,
          timestamp: op.timestamp
        });
      } else {
        operations.push(op);
      }
    }

    // Check if edge already exists and skip if it does
    if (entrypointId) {
      let edgeExists = false;
      if (graph.hasEdge(entrypointId, testId)) {
        edgeExists = true;
      }
      // If edge exists, we need to remove the edge operation that was added by createSimpleTestNodeOperationsPure
      if (edgeExists) {
        // Find and remove the edge operation
        const edgeOpIndex = operations.findIndex(op =>
          op.type === 'addEdge' &&
          op.data.source === entrypointId &&
          op.data.target === testId
        );
        if (edgeOpIndex !== -1) {
          operations.splice(edgeOpIndex, 1);
        }
      }
    }
  }

  // Also, ensure that all tests in the same entrypoint are connected to their entrypoint
  // Find all test nodes for this entrypoint
  const allTestNodes = graph.nodes().filter(nodeId => {
    const attrs = graph.getNodeAttributes(nodeId);
    return attrs.type === 'test' &&
      attrs.metadata?.configKey === sanitizedConfigKey &&
      attrs.metadata?.testName === filePathForEntrypoint;
  });

  // Use pure function to create connection operations only if we have an entrypointId
  if (entrypointId) {
    const connectionOps = connectAllTestsToEntrypointPure(
      entrypointId,
      allTestNodes,
      timestamp
    );

    // Filter out connections that already exist
    for (const op of connectionOps) {
      if (op.type === 'addEdge') {
        const edgeExists = graph.hasEdge(op.data.source, op.data.target);
        if (!edgeExists) {
          operations.push(op);
        }
      }
    }
  }

  // According to SOUL.md: no fallbacks. If there are no test nodes,
  // we should not create placeholder test nodes.

  return {
    operations,
    timestamp
  };
}
