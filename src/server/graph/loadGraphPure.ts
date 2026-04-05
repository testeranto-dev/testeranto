import fs from 'fs';
import path from 'path';
import { type GraphData, type TesterantoGraph, type GraphNodeAttributes, type GraphEdgeAttributes } from '../../graph/index';
import { createGraph } from '../../graph/createGraph';
import { dataToGraph } from '../../graph/dataToGraph';

// Pure function to load graph from file or create new
export function loadGraphPure(
  graphDataPath: string,
  projectRoot: string
): TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes> {
  // Load existing graph data if available, otherwise create fresh
  if (fs.existsSync(graphDataPath)) {
    try {
      const fileContent = fs.readFileSync(graphDataPath, 'utf-8');
      const parsed = JSON.parse(fileContent);

      // Handle only unified graph format
      let graphData: GraphData;
      if (parsed.data && parsed.data.unifiedGraph) {
        // Unified format: {timestamp, version, data: {unifiedGraph: {...}}}
        graphData = parsed.data.unifiedGraph;
        console.log('[GraphManager] Loading unified graph format');
      } else {
        // Old format detected - create fresh graph
        console.warn('[GraphManager] Old graph format detected - creating fresh unified graph');
        return createGraph();
      }

      const graph = dataToGraph(graphData);
      console.log(`[GraphManager] Loaded unified graph with ${graph.order} nodes and ${graph.size} edges`);
      return graph;
    } catch (error) {
      console.error('[GraphManager] Error loading existing graph, starting fresh:', error);
      return createGraph();
    }
  } else {
    // Start with a fresh graph if no file exists
    console.log('[GraphManager] Created fresh unified graph (no existing data found)');
    return createGraph();
  }
}
