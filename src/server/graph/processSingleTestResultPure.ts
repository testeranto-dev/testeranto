import { type GraphEdgeAttributes, type GraphNodeAttributes, type GraphOperation, type GraphUpdate, type TesterantoGraph } from '../../graph/index';
import type { TestResult } from "../types/testResults";
import { connectAllTestsToEntrypointPure } from './connectAllTestsToEntrypointPure';
import { createEntrypointNodeOperationsPure } from './createEntrypointNodeOperationsPure';
import { createFolderNodesAndEdgesPure } from './createFolderNodesAndEdgesPure';
import { createSimpleTestNodeOperationsPure } from './createSimpleTestNodeOperationsPure';
import { createTestNodeOperationsPure } from './createTestNodeOperationsPure';
import { createVerbNodesFromTestResultsPure } from './createVerbNodesFromTestResultsPure';
import { processFeaturesForTest } from './processFeaturesForTest';
import { processIndividualResultsPure } from './processIndividualResultsPure';
import { processTopLevelFeaturesPure } from './processTopLevelFeaturesPure';
import { processInputFilesForTestPure } from './processInputFilesForTestPure';
import { handleSimpleTestResultPure } from './handleSimpleTestResultPure';

export async function processSingleTestResultPure(
  singleTestResult: TestResult,
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  featureIngestor?: (url: string) => Promise<{ data: string; filepath: string }>,
  config?: any,
  timestamp?: string
): Promise<GraphUpdate> {
  const operations: GraphOperation[] = [];
  const actualTimestamp = timestamp || new Date().toISOString();

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
  
  const resultStr = JSON.stringify(singleTestResult);
  console.log(`[GraphManager] Full test result (first 500 chars):`, resultStr.substring(0, 500));

  const configKey = singleTestResult.configKey;
  const testName = singleTestResult.testName;

  if (!configKey || !testName) {
    console.log(`[GraphManager] configKey or testName not provided, skipping test results`);
    return {
      operations: [],
      timestamp: actualTimestamp
    };
  }

  console.log(`[GraphManager] Using configKey="${configKey}", testName="${testName}"`);

  const sanitizedConfigKey = configKey.replace(/[^a-zA-Z0-9:_\-.]/g, '_');
  console.log(`[GraphManager] Sanitized configKey="${sanitizedConfigKey}"`);

  const entrypointResult = createEntrypointNodeOperationsPure(
    configKey,
    sanitizedConfigKey,
    testName,
    singleTestResult,
    actualTimestamp
  );

  const { entrypointId, filePathForEntrypoint, operations: entrypointOps } = entrypointResult;

  console.log(`[GraphManager] Using filePathForEntrypoint="${filePathForEntrypoint}", entrypointId="${entrypointId}"`);

  if (entrypointId) {
    const existingEntrypointNode = graph.hasNode(entrypointId);

    for (const op of entrypointOps) {
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

    const parentFolderId = createFolderNodesAndEdgesPure(
      filePathForEntrypoint,
      projectRoot,
      operations,
      actualTimestamp
    );

    if (parentFolderId !== '') {
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
          timestamp: actualTimestamp
        });
      }
    }
  }

  await processIndividualResultsPure(
    singleTestResult,
    sanitizedConfigKey,
    filePathForEntrypoint,
    entrypointId,
    graph,
    projectRoot,
    featureIngestor,
    operations,
    actualTimestamp
  );

  await processTopLevelFeaturesPure(
    singleTestResult,
    sanitizedConfigKey,
    filePathForEntrypoint,
    graph,
    projectRoot,
    featureIngestor,
    operations,
    actualTimestamp
  );

  if (singleTestResult.inputFiles && Array.isArray(singleTestResult.inputFiles)) {
    console.log(`[GraphManager] Processing input files for test ${singleTestResult.testName}`);
    console.log(`[GraphManager] Found ${singleTestResult.inputFiles.length} input files:`, singleTestResult.inputFiles);
    console.log(`[GraphManager] Entrypoint ID: ${entrypointId}`);

    if (entrypointId) {
      console.log(`[GraphManager] Calling processInputFilesForTest`);
      await processInputFilesForTestPure(
        singleTestResult.inputFiles,
        entrypointId,
        operations,
        graph,
        projectRoot,
        actualTimestamp
      );
      console.log(`[GraphManager] Finished processing input files`);
    } else {
      console.log(`[GraphManager] No entrypointId, skipping input files processing`);
    }
  } else {
    console.log(`[GraphManager] No input files found for test ${singleTestResult.testName}`);
  }

  await handleSimpleTestResultPure(
    singleTestResult,
    sanitizedConfigKey,
    filePathForEntrypoint,
    entrypointId,
    graph,
    operations,
    actualTimestamp
  );

  const allTestNodes = graph.nodes().filter(nodeId => {
    const attrs = graph.getNodeAttributes(nodeId);
    return attrs.type === 'test' &&
      attrs.metadata?.configKey === sanitizedConfigKey &&
      attrs.metadata?.testName === filePathForEntrypoint;
  });

  if (entrypointId) {
    const connectionOps = connectAllTestsToEntrypointPure(
      entrypointId,
      allTestNodes,
      actualTimestamp
    );

    for (const op of connectionOps) {
      if (op.type === 'addEdge') {
        const edgeExists = graph.hasEdge(op.data.source, op.data.target);
        if (!edgeExists) {
          operations.push(op);
        }
      }
    }
  }

  return {
    operations,
    timestamp: actualTimestamp
  };
}
