import type {
  GraphData,
  GraphUpdate,
  GraphOperation
} from '../../graph/index';

// Client-side graph utilities for the stakeholder app
export class StakeholderGraphClient {
  private ws: WebSocket | null = null;
  private onGraphUpdate: (data: GraphData) => void;

  constructor(onGraphUpdate: (data: GraphData) => void) {
    this.onGraphUpdate = onGraphUpdate;
    // Stakeholder app should not use WebSocket or HTTP APIs
    // It only loads static files
    console.log('[StakeholderGraphClient] Stakeholder app uses static files only');
  }

  async fetchGraphData(): Promise<GraphData> {
    try {
      // Always load baseline from graph-data.json (static file)
      const response = await fetch('graph-data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      // Handle both direct GraphData and nested formats
      let graphData: GraphData;
      if (result.data && result.data.featureGraph) {
        // New format with nested data
        graphData = result.data.featureGraph;
      } else if (result.nodes) {
        // Direct GraphData format
        graphData = result;
      } else {
        throw new Error('Invalid graph data format');
      }
      
      this.onGraphUpdate(graphData);
      return graphData;
    } catch (error) {
      console.error('[StakeholderGraphClient] Failed to fetch graph data:', error);
      throw error;
    }
  }

  async updateGraph(operations: GraphOperation[]): Promise<GraphData> {
    // Stakeholder app should not update graph via HTTP
    // Graph updates are handled by the server and saved to graph-data.json
    console.warn('[StakeholderGraphClient] Stakeholder app cannot update graph - read only');
    throw new Error('Stakeholder app is read-only. Graph updates are not supported.');
  }

  disconnect(): void {
    // Nothing to disconnect - no WebSocket connection
  }
}
