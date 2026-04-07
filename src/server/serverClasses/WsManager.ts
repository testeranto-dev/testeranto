import { stakeholderWsAPI } from '../../api/api';

export class WsManager {
  escapeXml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  public processMessage(type: string, data: any): any {
    // Only handle ping for connection testing
    if (type === 'ping') {
      return {
        type: 'pong',
        timestamp: new Date().toISOString()
      };
    }

    // All other messages should use the common stakeholderWsAPI
    // But in the unified approach, clients should use HTTP POST /~/graph for updates
    // and WebSocket only receives broadcasts
    return {
      type: 'error',
      // TODO this is inaacrute
      message: `Message type '${type}' not supported. Use HTTP POST /~/graph for updates.`,
      timestamp: new Date().toISOString()
    };
  }
}
