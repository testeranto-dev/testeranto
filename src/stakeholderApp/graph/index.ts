import type {
  GraphData,
  GraphUpdate,
  GraphOperation
} from '../../graph/index';

// Client-side graph utilities for the stakeholder app
export class StakeholderGraphClient {
  private ws: WebSocket | null = null;
  private onGraphUpdate: (data: GraphData) => void;
  private isDevelopmentMode: boolean;

  constructor(onGraphUpdate: (data: GraphData) => void) {
    this.onGraphUpdate = onGraphUpdate;
    
    // Determine if we're in development mode (server API available)
    this.isDevelopmentMode = typeof window !== 'undefined' && 
      window.location.hostname.includes('localhost') &&
      window.location.protocol.startsWith('http');
    
    console.log(`[StakeholderGraphClient] Mode: ${this.isDevelopmentMode ? 'Development (WebSocket enabled)' : 'Static (read-only)'}`);
    
    // Only connect WebSocket in development mode
    if (this.isDevelopmentMode) {
      this.connectWebSocket();
    }
  }

  private connectWebSocket(): void {
    try {
      // Connect to WebSocket server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/~/ws`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[StakeholderGraphClient] WebSocket connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle graphUpdated messages
          if (message.type === 'graphUpdated') {
            console.log('[StakeholderGraphClient] Received graph update via WebSocket');
            // The server should send the updated graph data
            if (message.data && message.data.unifiedGraph) {
              this.onGraphUpdate(message.data.unifiedGraph);
            }
          }
          
          // Handle other relevant messages
          if (message.type === 'connected') {
            console.log('[StakeholderGraphClient] Server connection confirmed');
          }
        } catch (error) {
          console.error('[StakeholderGraphClient] Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[StakeholderGraphClient] WebSocket error:', error);
      };
      
      this.ws.onclose = () => {
        console.log('[StakeholderGraphClient] WebSocket disconnected');
        this.ws = null;
        
        // Attempt to reconnect after delay (only in development mode)
        if (this.isDevelopmentMode) {
          setTimeout(() => {
            console.log('[StakeholderGraphClient] Attempting to reconnect...');
            this.connectWebSocket();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('[StakeholderGraphClient] Failed to connect WebSocket:', error);
    }
  }

  async fetchGraphData(): Promise<GraphData> {
    try {
      // Always load baseline from graph-data.json (static file)
      const response = await fetch('graph-data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      // Handle only unified graph format
      let graphData: GraphData;
      if (result.data && result.data.unifiedGraph) {
        // New format with unifiedGraph (GraphDataFile format)
        graphData = result.data.unifiedGraph;
        console.log('[StakeholderGraphClient] Loaded GraphDataFile format');
      } else {
        // Old format - throw error
        throw new Error('Old graph format detected. Please regenerate graph-data.json with unified format.');
      }
      
      this.onGraphUpdate(graphData);
      return graphData;
    } catch (error) {
      console.error('[StakeholderGraphClient] Failed to fetch graph data:', error);
      throw error;
    }
  }

  async updateGraph(operations: GraphOperation[]): Promise<GraphData> {
    // Only allow updates in development mode
    if (!this.isDevelopmentMode) {
      console.warn('[StakeholderGraphClient] Stakeholder app is in static mode - read only');
      throw new Error('Stakeholder app is in static mode. Graph updates are not supported.');
    }
    
    try {
      // Send update to server via HTTP POST
      const response = await fetch('/~/graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operations,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // The server should return the updated graph data
      if (result.data && result.data.unifiedGraph) {
        this.onGraphUpdate(result.data.unifiedGraph);
        return result.data.unifiedGraph;
      } else {
        throw new Error('Invalid response from server');
      }
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
