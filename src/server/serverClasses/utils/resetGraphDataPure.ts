import type { GraphManager } from "../../graph/index";
import type { ITesterantoConfig } from "../../../Types";
import type { AllTestResults, RuntimeTestResults, TestResult } from "../../types/testResults";
import { Palette } from "../../../colors";

export interface ResetGraphDataResult {
  unifiedGraph: any;
  vizConfig: any;
  configs: any;
}

/**
 * Pure stateless function to reset and generate graph data.
 * This function handles updating the graph with test results, cleaning up nodes,
 * generating edges, and preparing the final graph data structure.
 */
export async function resetGraphDataPure(
  graphManager: GraphManager,
  configs: ITesterantoConfig,
  getCurrentTestResults: () => AllTestResults
): Promise<ResetGraphDataResult> {
  // Get graph data from GraphManager
  const graphData = graphManager ? graphManager.getGraphData() : { nodes: [], edges: [] };

  // Get test results if available
  const testResults = getCurrentTestResults();

  // Log detailed structure of test results
  if (testResults && typeof testResults === 'object') {
    if (Array.isArray(testResults)) {
      console.log(`[resetGraphDataPure] Test results is an array with ${testResults.length} items`);
      if (testResults.length > 0) {
        console.log(`[resetGraphDataPure] First item:`, testResults[0]);
        console.log(`[resetGraphDataPure] First item keys:`, Object.keys(testResults[0]));
      }
    } else {
      console.log(`[resetGraphDataPure] Test results keys:`, Object.keys(testResults));
      Object.entries(testResults).forEach(([key, value]) => {
        console.log(`[resetGraphDataPure] Key "${key}":`, {
          type: typeof value,
          isArray: Array.isArray(value),
          isObject: value && typeof value === 'object',
          keys: value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value) : 'not an object'
        });
      });
    }
  }

  // Update graph with test results
  if (Object.keys(testResults).length > 0) {

    for (const [configKey, configResults] of Object.entries(testResults as Record<string, RuntimeTestResults>)) {
      console.log(`[resetGraphDataPure] Processing configKey: ${configKey} with ${Object.keys(configResults).length} tests`);
      for (const [testName, testResult] of Object.entries(configResults as Record<string, TestResult>)) {
        // Create a combined test result object
        // testResult is a TestResultFile, which has a 'result' field containing the actual test results
        const actualTestResult = testResult.result || testResult;

        const combinedResult: TestResult = {
          testName,
          configKey: configKey,
          ...actualTestResult
        };
        try {
          if (graphManager) {
            const update = await graphManager.updateFromTestResults(combinedResult);
            graphManager.applyUpdate(update);
          }
        } catch (error) {
          console.error(`[resetGraphDataPure] Error updating graph for ${configKey}/${testName}:`, error);
        }
      }
    }
  } else {
    console.log('[resetGraphDataPure] No test results available to update graph');
  }

  // Clean up attribute nodes first
  if (graphManager) {

    const cleanupUpdate = graphManager.cleanupAttributeNodes();
    if (cleanupUpdate.operations.length > 0) {
      graphManager.applyUpdate(cleanupUpdate);
    }
  }

  // Always generate edges to ensure entrypoint nodes are created
  const update = graphManager.generateEdges();

  if (update.operations.length > 0) {
    graphManager.applyUpdate(update);
  }

  const updatedGraphData = graphManager ? graphManager.getGraphData() : { nodes: [], edges: [] };

  // Log if edges are missing
  if (updatedGraphData.nodes.length > 0 && updatedGraphData.edges.length === 0) {
    console.warn('[resetGraphDataPure] WARNING: Graph has nodes but no edges!');
  }

  // Prepare the full graph data structure in unified format
  const fullGraphData = {
    unifiedGraph: updatedGraphData,
    vizConfig: {
      projection: {
        xAttribute: 'status',
        yAttribute: 'priority',
        xType: 'categorical',
        yType: 'continuous',
        layout: 'grid'
      },
      style: {
        nodeSize: 10,
        nodeColor: Palette.rust,
        nodeShape: 'circle'
      }
    },
    configs: {
      runtimes: configs?.runtimes || {},
      stakeholderReactModule: configs?.stakeholderReactModule,
      featureIngestor: configs?.featureIngestor ? 'present' : 'not present'
    }
  };

  return fullGraphData;
}
