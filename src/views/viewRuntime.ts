/**
 * Runtime JavaScript for views in dynamic mode
 * This would be included in compiled HTML files when includeRuntime is true
 */

export interface ViewRuntimeOptions {
  /** Path to the data file */
  dataPath: string;
  /** ID of the root element */
  rootId: string;
  /** Server API endpoint for updates */
  apiEndpoint?: string;
}

/**
 * Initialize a view in dynamic mode
 */
export async function initView(options: ViewRuntimeOptions) {
  const { dataPath, rootId, apiEndpoint = '/~/api' } = options;
  const rootElement = document.getElementById(rootId);

  if (!rootElement) {
    console.error(`Root element with id "${rootId}" not found`);
    return;
  }

  console.log(`Initializing view with data from ${dataPath}`);

  // Load initial data
  try {
    const response = await fetch(dataPath);
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status}`);
    }
    const data = await response.json();

    // Render the data
    renderData(rootElement, data);

    // Set up WebSocket connection for real-time updates
    setupWebSocket(dataPath, (newData) => {
      renderData(rootElement, newData);
    });

    // Set up polling as fallback
    setupPolling(dataPath, (newData) => {
      renderData(rootElement, newData);
    });

  } catch (error) {
    console.error('Error initializing view:', error);
    rootElement.innerHTML = `
      <div class="error">
        <h3>Error loading view</h3>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    `;
  }
}

function renderData(element: HTMLElement, data: any) {
  // Simple rendering - in a real implementation, this would use a proper templating system
  // or hydrate a React component
  element.innerHTML = `
    <div>
      <h2>View Data</h2>
      <pre>${JSON.stringify(data, null, 2)}</pre>
      <p><small>Last updated: ${new Date().toLocaleTimeString()}</small></p>
    </div>
  `;
}

function setupWebSocket(dataPath: string, onUpdate: (data: any) => void) {
  // Try to connect via WebSocket
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `\${protocol}//\${window.location.host}/~/ws\/`;

  try {
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Subscribe to updates for this data path
      ws.send(JSON.stringify({
        type: 'subscribe',
        path: dataPath,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'update' && message.path === dataPath) {
          onUpdate(message.data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

  } catch (error) {
    console.log('WebSocket not available, falling back to polling');
  }
}

function setupPolling(dataPath: string, onUpdate: (data: any) => void) {
  let isPolling = true;

  async function poll() {
    if (!isPolling) return;

    try {
      const response = await fetch(dataPath);
      if (response.ok) {
        const data = await response.json();
        onUpdate(data);
      }
    } catch (error) {
      console.error('Polling error:', error);
    }

    // Poll every 10 seconds
    setTimeout(poll, 10000);
  }

  // Start polling
  poll();

  // Return a function to stop polling
  return () => {
    isPolling = false;
  };
}
