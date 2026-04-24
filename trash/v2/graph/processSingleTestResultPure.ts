import { connectAllTestsToEntrypointPure } from './connectAllTestsToEntrypointPure';
import { createEntrypointNodeOperationsPure } from './createEntrypointNodeOperationsPure';
import { createFolderNodesAndEdgesPure } from './createFolderNodesAndEdgesPure';
import { handleSimpleTestResultPure } from './handleSimpleTestResultPure';
import { processIndividualResultsPure } from './processIndividualResultsPure';
import { processInputFilesForTestPure } from './processInputFilesForTestPure';
import { processTopLevelFeaturesPure } from './processTopLevelFeaturesPure';
import { loadInputFilesFromBundle } from './loadInputFilesFromBundle';
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphUpdate, GraphOperation } from '../../../graph';
import type { TestResult } from '../Server_Docker/TestResultsCollector';

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

  console.log(`[processSingleTestResultPure] Starting to process test result:`, {
    configKey: singleTestResult.configKey,
    testName: singleTestResult.testName,
    hasIndividualResults: singleTestResult.individualResults?.length || 0,
    hasFeatures: singleTestResult.features?.length || 0,
    failed: singleTestResult.failed
  });

  const configKey = singleTestResult.configKey;
  const testName = singleTestResult.testName;

  if (!configKey || !testName) {
    console.log(`[processSingleTestResultPure] configKey or testName not provided, skipping test results`);
    return {
      operations: [],
      timestamp: actualTimestamp
    };
  }

  const sanitizedConfigKey = configKey.replace(/[^a-zA-Z00-9:_\-.]/g, '_');
  console.log(`[processSingleTestResultPure] Sanitized config key: ${sanitizedConfigKey}`);
  
  // Load input files from bundle if not present in test results
  let inputFiles = singleTestResult.inputFiles;
  if (!inputFiles || !Array.isArray(inputFiles)) {
    console.log(`[processSingleTestResultPure] No input files in test result, loading from bundle`);
    inputFiles = loadInputFilesFromBundle(configKey, testName, projectRoot);
    if (inputFiles.length > 0) {
      console.log(`[processSingleTestResultPure] Augmented test result with ${inputFiles.length} input files from bundle`);
      // Create a copy with input files
      singleTestResult = {
        ...singleTestResult,
        inputFiles
      };
    } else {
      console.log(`[processSingleTestResultPure] No input files found in bundle either`);
    }
  } else {
    console.log(`[processSingleTestResultPure] Test result already has ${inputFiles.length} input files`);
  }

  const entrypointResult = createEntrypointNodeOperationsPure(
    configKey,
    sanitizedConfigKey,
    testName,
    singleTestResult,
    actualTimestamp
  );

  console.log(`[processSingleTestResultPure] Entrypoint result:`, {
    entrypointId: entrypointResult.entrypointId,
    filePathForEntrypoint: entrypointResult.filePathForEntrypoint,
    operationsCount: entrypointResult.operations.length
  });

  const { entrypointId, filePathForEntrypoint, operations: entrypointOps } = entrypointResult;

  if (entrypointId) {
    const existingEntrypointNode = graph.hasNode(entrypointId);
    console.log(`[processSingleTestResultPure] Entrypoint node ${entrypointId} exists: ${existingEntrypointNode}`);

    for (const op of entrypointOps) {
      if (op.type === 'addNode' && existingEntrypointNode) {
        operations.push({
          type: 'updateNode',
          data: op.data,
          timestamp: op.timestamp
        });
        console.log(`[processSingleTestResultPure] Converting addNode to updateNode for existing entrypoint`);
      } else {
        operations.push(op);
        console.log(`[processSingleTestResultPure] Adding operation: ${op.type} for ${op.data?.id || 'unknown'}`);
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

  console.log(`[processSingleTestResultPure] Processing individual results...`);
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
  console.log(`[processSingleTestResultPure] After processing individual results, operations count: ${operations.length}`);

  console.log(`[processSingleTestResultPure] Processing top-level features...`);
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
  console.log(`[processSingleTestResultPure] After processing top-level features, operations count: ${operations.length}`);

  // Process input files (now they should be available)
  console.log(`[processSingleTestResultPure] Processing input files (count: ${inputFiles?.length || 0})...`);
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
      console.log(`[processSingleTestResultPure] Processed ${inputFiles.length} input files`);
    } else {
      console.log(`[processSingleTestResultPure] No entrypointId, skipping input files processing`);
    }
  } else {
    console.log(`[processSingleTestResultPure] No input files found for test ${singleTestResult.testName}`);
  }

  console.log(`[processSingleTestResultPure] Handling simple test result...`);
  await handleSimpleTestResultPure(
    singleTestResult,
    sanitizedConfigKey,
    filePathForEntrypoint,
    entrypointId,
    graph,
    operations,
    actualTimestamp
  );
  console.log(`[processSingleTestResultPure] After handling simple test result, operations count: ${operations.length}`);

  console.log(`[processSingleTestResultPure] Finding all test nodes...`);
  const allTestNodes = graph.nodes().filter(nodeId => {
    const attrs = graph.getNodeAttributes(nodeId);
    const isTest = attrs.type === 'test' &&
      attrs.metadata?.configKey === sanitizedConfigKey &&
      attrs.metadata?.testName === filePathForEntrypoint;
    if (isTest) {
      console.log(`[processSingleTestResultPure] Found test node: ${nodeId}`);
    }
    return isTest;
  });
  console.log(`[processSingleTestResultPure] Found ${allTestNodes.length} test nodes`);

  if (entrypointId) {
    console.log(`[processSingleTestResultPure] Connecting ${allTestNodes.length} test nodes to entrypoint ${entrypointId}`);
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
          console.log(`[processSingleTestResultPure] Adding edge from ${op.data.source} to ${op.data.target}`);
        } else {
          console.log(`[processSingleTestResultPure] Edge already exists from ${op.data.source} to ${op.data.target}`);
        }
      }
    }
  }

  console.log(`[processSingleTestResultPure] Completed processing. Total operations: ${operations.length}`);
  console.log(`[processSingleTestResultPure] Operation types:`, operations.map(op => op.type));
  
  return {
    operations,
    timestamp: actualTimestamp
  };
}
