import React from 'react';
import type { GraphData } from '../graph';
import { getSliceFilePath, extractViewName } from './utils';

export interface BaseViewProps<T = GraphData> {
  /** Path to the slice JSON file */
  slicePath: string;
  /** Width of the view */
  width?: number;
  /** Height of the view */
  height?: number;
  /** Optional configuration for the view */
  config?: Record<string, any>;
  /** WebSocket update to trigger reloads */
  wsUpdate?: { path: string; type: string };
}

export abstract class BaseViewClass<T = GraphData> extends React.Component<BaseViewProps<T>> {
  state = {
    data: null as T | null,
    loading: true,
    error: null as string | null,
  };

  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  componentDidMount() {
    this.loadData();
    this.connectWebSocket();
  }

  componentDidUpdate(prevProps: BaseViewProps<T>) {
    if (prevProps.slicePath !== this.props.slicePath) {
      this.loadData();
    }
    // Also handle prop-based WebSocket updates for backward compatibility
    if (this.props.wsUpdate && this.props.wsUpdate.type === 'update') {
      const currentViewName = extractViewName(this.props.slicePath);
      const updatedViewName = extractViewName(this.props.wsUpdate.path);
      if (updatedViewName === currentViewName) {
        console.log(`[BaseViewClass] WebSocket update received via props for view: ${currentViewName}, reloading data`);
        this.loadData();
      }
    }
  }

  componentWillUnmount() {
    this.disconnectWebSocket();
  }

  connectWebSocket() {
    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    console.log(`[BaseViewClass] Attempting to connect WebSocket for view ${extractViewName(this.props.slicePath)} to ${wsUrl}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        const viewName = extractViewName(this.props.slicePath);
        console.log(`[BaseViewClass] WebSocket connected for view: ${viewName}`);
        this.reconnectAttempts = 0;

        // Subscribe to slice updates for this view
        const subscribeMessage = {
          type: 'subscribeToSlice',
          slicePath: `/~/views/${viewName}/slice`
        };
        console.log(`[BaseViewClass] Sending subscribe message:`, subscribeMessage);
        this.ws?.send(JSON.stringify(subscribeMessage));
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('[BaseViewClass] Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[BaseViewClass] WebSocket disconnected for view: ${extractViewName(this.props.slicePath)}`, event.code, event.reason);

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

          console.log(`[BaseViewClass] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

          this.reconnectTimeout = setTimeout(() => {
            this.connectWebSocket();
          }, delay);
        }
      };

      this.ws.onerror = (error) => {
        const viewName = extractViewName(this.props.slicePath);
        console.error(`[BaseViewClass] WebSocket error for view ${viewName}:`, error);
        console.error(`[BaseViewClass] WebSocket readyState: ${this.ws?.readyState}`);
      };

    } catch (error) {
      console.error('[BaseViewClass] Failed to create WebSocket connection:', error);
    }
  }

  disconnectWebSocket() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      // Unsubscribe before closing
      const viewName = extractViewName(this.props.slicePath);
      const unsubscribeMessage = {
        type: 'unsubscribeFromSlice',
        slicePath: `/~/views/${viewName}/slice`
      };

      try {
        this.ws.send(JSON.stringify(unsubscribeMessage));
      } catch (error) {
        // Ignore errors during unsubscribe
      }

      this.ws.close();
      this.ws = null;
    }
  }

  handleWebSocketMessage(message: any) {
    const viewName = extractViewName(this.props.slicePath);

    // Log all WebSocket messages for debugging
    console.log(`[BaseViewClass] WebSocket message received for view ${viewName}:`, {
      type: message.type,
      url: message.url,
      slicePath: message.slicePath,
      timestamp: message.timestamp
    });

    // Handle different message types
    switch (message.type) {
      case 'resourceChanged':
        // Check if this resource change affects our view
        if (message.url && message.url.includes(`/~/views/${viewName}`)) {
          console.log(`[BaseViewClass] Resource changed for view ${viewName}, reloading data`);
          this.loadData();
        } else if (message.url && message.url === '/~/graph') {
          // Graph updates should trigger view reloads
          console.log(`[BaseViewClass] Graph resource changed, reloading data for view ${viewName}`);
          this.loadData();
        }
        break;

      case 'sliceUpdated':
        // Direct slice update notification
        if (message.slicePath === `/~/views/${viewName}/slice`) {
          console.log(`[BaseViewClass] Slice updated for view ${viewName}, reloading data`);
          this.loadData();
        }
        break;

      case 'graphUpdated':
        // Graph updates often mean view slices need refreshing
        console.log(`[BaseViewClass] Graph updated, reloading data for view ${viewName}`);
        this.loadData();
        break;

      case 'subscribedToSlice':
        if (message.slicePath === `/~/views/${viewName}/slice`) {
          console.log(`[BaseViewClass] Successfully subscribed to slice updates for view ${viewName}`);
        }
        break;

      case 'unsubscribedFromSlice':
        if (message.slicePath === `/~/views/${viewName}/slice`) {
          console.log(`[BaseViewClass] Unsubscribed from slice updates for view ${viewName}`);
        }
        break;

      default:
        // Log unhandled message types for debugging
        console.log(`[BaseViewClass] Unhandled message type: ${message.type}`);
        break;
    }
  }

  async loadData() {
    const { slicePath } = this.props;

    if (!slicePath) {
      this.setState({ error: 'slicePath is empty or undefined', loading: false });
      return;
    }

    try {
      this.setState({ loading: true, error: null });
      // Always use static file paths
      const viewName = extractViewName(slicePath);
      const staticFilePath = getSliceFilePath(viewName);

      // Use the static file path directly (relative URL)
      const dataUrl = staticFilePath.startsWith('/')
        ? staticFilePath
        : `/${staticFilePath}`;

      console.log(`[BaseViewClass] Loading slice data from: ${dataUrl} (view: ${viewName}, original: ${slicePath})`);

      // Add cache busting to ensure fresh data
      const cacheBuster = `?_t=${Date.now()}`;
      const response = await fetch(dataUrl + cacheBuster);

      if (!response.ok) {
        throw new Error(`Failed to load slice data from ${absolutePath}: ${response.status} ${response.statusText}`);
      }

      const jsonData = await response.json();
      this.setState({ data: jsonData, loading: false });
    } catch (err) {
      this.setState({
        error: err instanceof Error ? err.message : 'Unknown error loading slice data',
        loading: false
      });
    }
  }

  // Abstract method to be implemented by subclasses
  abstract renderContent(): React.ReactNode;

  render() {
    const { loading, error, data } = this.state;
    const { width = 800, height = 600 } = this.props;

    if (loading) {
      // no-op for now
      // return (
      //   <div style={{
      //     display: 'flex',
      //     justifyContent: 'center',
      //     alignItems: 'center',
      //     width,
      //     height,
      //     border: '1px solid #ccc',
      //     borderRadius: '4px',
      //     backgroundColor: '#fafafa'
      //   }}>
      //     <div style={{ textAlign: 'center' }}>
      //       <h3>Loading view...</h3>
      //       <p>Loading slice data from:</p>
      //       <p style={{
      //         fontFamily: 'monospace',
      //         backgroundColor: '#f0f0f0',
      //         padding: '5px',
      //         borderRadius: '3px',
      //         margin: '10px',
      //         wordBreak: 'break-all'
      //       }}>
      //         {this.props.slicePath}
      //       </p>
      //       <p>WebSocket: {this.ws?.readyState === WebSocket.OPEN ? 'Connected' : 'Connecting...'}</p>
      //     </div>
      //   </div>
      // );
    }

    if (error) {
      return (
        <div style={{
          padding: '20px',
          border: '1px solid #d32f2f',
          borderRadius: '4px',
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          width,
          height,
          overflow: 'auto'
        }}>
          <h3>Error loading view</h3>
          <p><strong>Error message:</strong> {error}</p>
          <p><strong>Slice path:</strong> {this.props.slicePath}</p>
          <p><strong>WebSocket status:</strong> {this.ws?.readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected'}</p>
          <button
            onClick={() => this.loadData()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Retry Load
          </button>
        </div>
      );
    }

    if (!data) {
      return (
        <div style={{
          padding: '20px',
          border: '1px solid #ff9800',
          borderRadius: '4px',
          backgroundColor: '#fff3e0',
          color: '#f57c00',
          width,
          height
        }}>
          <h3>No data available</h3>
          <p>Slice data is empty or could not be parsed.</p>
          <p>Slice path: {this.props.slicePath}</p>
          <button
            onClick={() => this.loadData()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Retry Load
          </button>
        </div>
      );
    }

    return this.renderContent();
  }
}
