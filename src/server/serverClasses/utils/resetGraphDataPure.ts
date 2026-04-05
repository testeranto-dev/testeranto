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
  graphManager: GraphManager | null,
  configs: ITesterantoConfig | null,
  getCurrentTestResults: () => AllTestResults
): Promise<ResetGraphDataResult> {
  console.log('[resetGraphDataPure] resetGraphData() called');

  // Generate graph data based on current configuration and test results
  console.log(`[resetGraphDataPure] Configs has ${Object.keys(configs?.runtimes || {}).length} runtimes`);

  // Get graph data from GraphManager
  const graphData = graphManager ? graphManager.getGraphData() : { nodes: [], edges: [] };
  console.log(`[resetGraphDataPure] Initial graph data from GraphManager: ${graphData.nodes?.length || 0} nodes, ${graphData.edges?.length || 0} edges`);

  // Get test results if available
  const testResults = getCurrentTestResults();
  console.log(`[resetGraphDataPure] Raw test results type:`, typeof testResults);
  console.log(`[resetGraphDataPure] Raw test results:`, testResults);

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
    console.log('[resetGraphDataPure] Updating graph with test results...');
    for (const [configKey, configResults] of Object.entries(testResults as Record<string, RuntimeTestResults>)) {
      console.log(`[resetGraphDataPure] Processing configKey: ${configKey} with ${Object.keys(configResults).length} tests`);
      for (const [testName, testResult] of Object.entries(configResults as Record<string, TestResult>)) {
        // Create a combined test result object
        // testResult is a TestResultFile, which has a 'result' field containing the actual test results
        const actualTestResult = testResult.result || testResult;
        console.log(`[resetGraphDataPure] Processing test ${configKey}/${testName}`);
        console.log(`[resetGraphDataPure] actualTestResult keys:`, Object.keys(actualTestResult));
        console.log(`[resetGraphDataPure] Has features field:`, 'features' in actualTestResult);
        if ('features' in actualTestResult) {
          console.log(`[resetGraphDataPure] Features:`, actualTestResult.features);
        }
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
    console.log('[resetGraphDataPure] Cleaning up attribute nodes...');
    const cleanupUpdate = graphManager.cleanupAttributeNodes();
    if (cleanupUpdate.operations.length > 0) {
      console.log(`[resetGraphDataPure] Found ${cleanupUpdate.operations.length} attribute nodes to clean up`);
      graphManager.applyUpdate(cleanupUpdate);
    }
  }

  // Always generate edges to ensure entrypoint nodes are created
  console.log('[resetGraphDataPure] Checking if we should generate edges...');
  if (graphManager) {
    console.log('[resetGraphDataPure] GraphManager exists, generating edges to ensure entrypoint nodes exist...');
    const update = graphManager.generateEdges();
    console.log(`[resetGraphDataPure] Generated ${update.operations.length} edge operations`);
    if (update.operations.length > 0) {
      graphManager.applyUpdate(update);
      console.log(`[resetGraphDataPure] Applied ${update.operations.length} edge generation operations`);
    } else {
      console.log('[resetGraphDataPure] No edge generation operations needed');
    }
  } else {
    console.log('[resetGraphDataPure] GraphManager is null');
  }

  // Log graph statistics (but don't save here - saveGraphDataForStaticMode() will save)
  if (graphManager) {
    const stats = graphManager.getGraphStats();
    console.log(`[resetGraphDataPure] Graph stats: ${stats.nodes} nodes, ${stats.edges} edges`);
    console.log(`[resetGraphDataPure] Node types:`, stats.nodeTypes);
    console.log(`[resetGraphDataPure] Edge types:`, stats.edgeTypes);
  }

  // Get updated graph data
  const updatedGraphData = graphManager ? graphManager.getGraphData() : { nodes: [], edges: [] };
  console.log(`[resetGraphDataPure] Updated graph data: ${updatedGraphData.nodes?.length || 0} nodes, ${updatedGraphData.edges?.length || 0} edges`);

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
      documentationGlob: configs?.documentationGlob,
      stakeholderReactModule: configs?.stakeholderReactModule,
      featureIngestor: configs?.featureIngestor ? 'present' : 'not present'
    }
  };

  return fullGraphData;
}
