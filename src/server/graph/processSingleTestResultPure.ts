import type { TestResult } from "../types/testResults";
import { connectAllTestsToEntrypointPure } from './connectAllTestsToEntrypointPure';
import { createEntrypointNodeOperationsPure } from './createEntrypointNodeOperationsPure';
import { createFolderNodesAndEdgesPure } from './createFolderNodesAndEdgesPure';
import { handleSimpleTestResultPure } from './handleSimpleTestResultPure';
import { processIndividualResultsPure } from './processIndividualResultsPure';
import { processInputFilesForTestPure } from './processInputFilesForTestPure';
import { processTopLevelFeaturesPure } from './processTopLevelFeaturesPure';
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphUpdate, GraphOperation } from '.';
import { loadInputFilesFromBundle } from './loadInputFilesFromBundle';

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

  const resultStr = JSON.stringify(singleTestResult);

  const configKey = singleTestResult.configKey;
  const testName = singleTestResult.testName;

  if (!configKey || !testName) {
    console.log(`[GraphManager] configKey or testName not provided, skipping test results`);
    return {
      operations: [],
      timestamp: actualTimestamp
    };
  }

  const sanitizedConfigKey = configKey.replace(/[^a-zA-Z0-9:_\-.]/g, '_');
  // Load input files from bundle if not present in test results
  let inputFiles = singleTestResult.inputFiles;
  if (!inputFiles || !Array.isArray(inputFiles)) {
    inputFiles = loadInputFilesFromBundle(configKey, testName, projectRoot);
    if (inputFiles.length > 0) {
      console.log(`[GraphManager] Augmented test result with ${inputFiles.length} input files from bundle`);
      // Create a copy with input files
      singleTestResult = {
        ...singleTestResult,
        inputFiles
      };
    }
  }

  const entrypointResult = createEntrypointNodeOperationsPure(
    configKey,
    sanitizedConfigKey,
    testName,
    singleTestResult,
    actualTimestamp
  );

  const { entrypointId, filePathForEntrypoint, operations: entrypointOps } = entrypointResult;

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

  // Process input files (now they should be available)
  if (inputFiles && Array.isArray(inputFiles) && inputFiles.length > 0) {
    if (entrypointId) {
      await processInputFilesForTestPure(
        inputFiles,
        entrypointId,
        operations,
        graph,
        projectRoot,
        actualTimestamp
      );
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
