import * as TestTreeUtils from './utils/testTree';

export function handleWebSocketMessage(provider: any, message: any): void {
  console.log('[TestTreeDataProvider] Received WebSocket message:', message.type);

  switch (message.type) {
    case 'connected':
      console.log('[TestTreeDataProvider] WebSocket connection confirmed');
      break;
    case 'resourceChanged':
      console.log('[TestTreeDataProvider] Resource changed, fetching updated configs:', message.url);
      if (message.url === '/~/configs') {
        provider._onDidChangeTreeData.fire();
      }
      break;
    case 'graphUpdated':
      console.log('[TestTreeDataProvider] Graph updated, refreshing tree');
      // Force a refresh of the tree data
      provider._onDidChangeTreeData.fire();
      break;
    default:
      console.log('[TestTreeDataProvider] Unhandled message type:', message.type);
  }
}
