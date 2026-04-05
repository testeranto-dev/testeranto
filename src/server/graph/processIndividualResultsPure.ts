import { type GraphEdgeAttributes, type GraphNodeAttributes, type GraphOperation, type TesterantoGraph } from '../../graph/index';
import type { TestResult } from "../types/testResults";
import { createTestNodeOperationsPure } from './createTestNodeOperationsPure';
import { createVerbNodesFromTestResultsPure } from './createVerbNodesFromTestResultsPure';
import { processFeaturesForTest } from './processFeaturesForTest';
import { processInputFilesForTestPure } from './processInputFilesForTestPure';
import fs from 'fs';
import path from 'path';

// Helper function to load input files from bundle directory
function loadInputFilesFromBundleForIndividual(
  configKey: string,
  testName: string,
  projectRoot: string
): string[] {
  try {
    const bundleDir = path.join(projectRoot, 'testeranto', 'bundles', configKey);
    const inputFilesPath = path.join(bundleDir, 'inputFiles.json');
    
    if (fs.existsSync(inputFilesPath)) {
      const content = fs.readFileSync(inputFilesPath, 'utf-8');
      const allTestsInfo = JSON.parse(content);
      
      if (allTestsInfo[testName] && allTestsInfo[testName].files) {
        return allTestsInfo[testName].files;
      }
    }
  } catch (error) {
    console.error(`[GraphManager] Error loading input files from bundle for ${configKey}/${testName}:`, error);
  }
  return [];
}

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

  // Load input files from bundle for the entire test
  const bundleInputFiles = loadInputFilesFromBundleForIndividual(
    singleTestResult.configKey || sanitizedConfigKey,
    singleTestResult.testName || filePathForEntrypoint,
    projectRoot
  );

  if (singleTestResult.individualResults.length > 0) {
    for (let i = 0; i < singleTestResult.individualResults.length; i++) {
      const individualResult = singleTestResult.individualResults[i];
      const stepName = individualResult.stepName;
      if (!stepName) {
        console.log(`[GraphManager] individualResult missing stepName, skipping`);
        continue;
      }

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

      // Use input files from individual result or from bundle
      let inputFiles = individualResult.inputFiles;
      if (!inputFiles || !Array.isArray(inputFiles)) {
        inputFiles = bundleInputFiles;
      }

      console.log(`[GraphManager] Checking for input files in individual result ${i}:`, inputFiles);
      if (inputFiles && Array.isArray(inputFiles) && inputFiles.length > 0) {
        console.log(`[GraphManager] Processing ${inputFiles.length} input files for individual result ${i}:`, inputFiles);
        console.log(`[GraphManager] Entrypoint ID for individual result: ${entrypointId}`);
        if (entrypointId) {
          console.log(`[GraphManager] Calling processInputFilesForTest for individual result`);
          await processInputFilesForTestPure(
            inputFiles,
            entrypointId,
            operations,
            graph,
            projectRoot,
            timestamp
          );
          console.log(`[GraphManager] Finished processing input files for individual result`);
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
