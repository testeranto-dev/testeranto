import type { GraphOperation, GraphUpdate } from '../../graph/index';

export async function sendGraphUpdate(operations: GraphOperation[]): Promise<void> {
  const update: GraphUpdate = {
    operations,
    timestamp: new Date().toISOString()
  };

  // Check if we're in development mode (server available)
  const isDevelopmentMode = typeof window !== 'undefined' &&
    (window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1') ||
      window.location.port !== '');

  if (!isDevelopmentMode) {
    console.warn('[sendGraphUpdate] Stakeholder app is in static mode - graph updates are not supported');
    throw new Error('Stakeholder app is in static mode. Graph updates are not supported.');
  }

  try {
    const response = await fetch('/~/graph', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(update)
    });

    if (!response.ok) {
      throw new Error(`Failed to update graph: ${response.statusText}`);
    }

    // The server will broadcast the update via WebSocket
    // The client will receive it and update accordingly
    console.log('Graph update sent successfully');
  } catch (error) {
    console.error('Error sending graph update:', error);
    throw error;
  }
}
