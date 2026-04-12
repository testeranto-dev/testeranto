import type { TestResult } from "../types/testResults";
import { createTestNodeOperationsPure } from './createTestNodeOperationsPure';
import { createVerbNodesFromTestResultsPure } from './createVerbNodesFromTestResultsPure';
import { processFeaturesForTest } from './processFeaturesForTest';
import { processInputFilesForTestPure } from './processInputFilesForTestPure';
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes, GraphOperation } from '.';
import { loadInputFilesFromBundleForIndividual } from './loadInputFilesFromBundleForIndividual';

export async function processIndividualResultsPure(
  singleTestResult: TestResult,
  sanitizedConfigKey: string,
  filePathForEntrypoint: string,
  entrypointId: string | undefined,
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  projectRoot: string,
  featureIngestor: ((url: string) => Promise<{ data: string; filepath: string }>) | undefined,
  operations: GraphOperation[],
  timestamp: string
): Promise<void> {
  if (!entrypointId || !singleTestResult.individualResults || !Array.isArray(singleTestResult.individualResults)) {
    return;
  }

  const bundleInputFiles = loadInputFilesFromBundleForIndividual(
    singleTestResult.configKey || sanitizedConfigKey,
    singleTestResult.testName || filePathForEntrypoint,
    projectRoot
  );

  if (singleTestResult.individualResults.length > 0) {
    for (let i = 0; i < singleTestResult.individualResults.length; i++) {
      const individualResult = singleTestResult.individualResults[i];
      const stepName = individualResult.stepName;


      const testOps = createTestNodeOperationsPure(
        sanitizedConfigKey,
        filePathForEntrypoint,
        individualResult,
        entrypointId,
        timestamp,
        i
      );

      const testId = `test:${sanitizedConfigKey}:${filePathForEntrypoint}:${i}`;
      const existingTestNode = graph.hasNode(testId);

      for (const op of testOps) {
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

      if (entrypointId) {
        let edgeExists = false;
        if (graph.hasEdge(entrypointId, testId)) {
          edgeExists = true;
        }
        if (edgeExists) {
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

      const verbOps = createVerbNodesFromTestResultsPure(
        {
          ...singleTestResult,
          individualResults: [individualResult]
        },
        testId,
        timestamp
      );
      operations.push(...verbOps);

      if (individualResult.features && Array.isArray(individualResult.features)) {
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
        // console.log(`[GraphManager] No features found for individual result ${i}`);
      }

      // Use input files from individual result or from bundle
      let inputFiles = individualResult.inputFiles;
      if (!inputFiles || !Array.isArray(inputFiles)) {
        inputFiles = bundleInputFiles;
      }

      if (inputFiles && Array.isArray(inputFiles) && inputFiles.length > 0) {
        if (entrypointId) {
          await processInputFilesForTestPure(
            inputFiles,
            entrypointId,
            operations,
            graph,
            projectRoot,
            timestamp
          );
        } else {
          console.log(`[GraphManager] No entrypointId for individual result, skipping`);
        }
      } else {
        console.log(`[GraphManager] No input files in individual result ${i}`);
      }
    }
  } else {
    console.log(`[GraphManager] individualResults array is empty, creating a single placeholder test node`);
    const { createSimpleTestNodeOperationsPure } = await import('./createSimpleTestNodeOperationsPure');
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
    for (const op of placeholderTestOps) {
      if (op.type === 'addNode' && op.data.type === 'test') {
        op.data.label = 'Test suite';
        op.data.description = `Test suite: ${filePathForEntrypoint}`;
      }
      operations.push(op);
    }
  }
}
