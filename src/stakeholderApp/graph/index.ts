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
    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[StakeholderGraphClient] WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'graphUpdated') {
          console.log('[StakeholderGraphClient] Graph update received, refreshing...');
          this.fetchGraphData();
        }
      } catch (error) {
        console.error('[StakeholderGraphClient] Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[StakeholderGraphClient] WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('[StakeholderGraphClient] WebSocket closed, reconnecting in 5s...');
      setTimeout(() => this.connectWebSocket(), 5000);
    };
  }

  async fetchGraphData(): Promise<GraphData> {
    try {
      const response = await fetch('/~/graph');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.graphData) {
        this.onGraphUpdate(result.graphData);
        return result.graphData;
      }
      throw new Error('Invalid graph data response');
    } catch (error) {
      console.error('[StakeholderGraphClient] Failed to fetch graph data:', error);
      throw error;
    }
  }

  async updateGraph(operations: GraphOperation[]): Promise<GraphData> {
    const update: GraphUpdate = {
      operations,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('/~/graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(update)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.graphData) {
        this.onGraphUpdate(result.graphData);
        return result.graphData;
      }
      throw new Error('Invalid graph update response');
    } catch (error) {
      console.error('[StakeholderGraphClient] Failed to update graph:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
