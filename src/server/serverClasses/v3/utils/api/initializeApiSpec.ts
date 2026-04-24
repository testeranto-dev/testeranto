import { API, wsApi } from "../../../../../api";

export interface ApiSpec {
  http: Record<string, any>;
  ws: Record<string, any>;
}

export function initializeApiSpec(): ApiSpec {
  // Build HTTP API spec from API.ts
  const httpSpec: Record<string, any> = {};
  for (const [key, endpoint] of Object.entries(API)) {
    httpSpec[key] = {
      method: endpoint.method,
      path: endpoint.path,
      description: endpoint.description,
      params: endpoint.params || {},
      query: endpoint.query || {},
      response: endpoint.response,
    };
  }

  // Build WebSocket API spec from wsApi
  const wsSpec: Record<string, any> = {};
  for (const [key, message] of Object.entries(wsApi)) {
    // Handle special cases
    if (key === 'slices') {
      // 'slices' is a collection of slice paths, not a message type
      // Store it as-is without adding extra properties
      wsSpec[key] = message;
    } else {
      // Regular WebSocket message
      wsSpec[key] = {
        type: message.type,
        description: message.description,
        data: message.data || {},
      };
    }
  }

  return { http: httpSpec, ws: wsSpec };
}
