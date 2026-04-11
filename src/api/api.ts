// Never hardcode routes!
// these files exist to be imported!

import { vscodeHttpAPI, type VscodeHttpAPI } from "./vscodeExtensionHttp";
export type HttpMethod = 'GET' | 'POST' | 'PUT' |
  'DELETE' | 'PATCH' | 'OPTIONS';

export interface ApiEndpointDefinition<TParams = any, TQuery = any, TResponse = any> {
  method: HttpMethod;
  path: string;
  description: string;
  params?: TParams;
  query?: TQuery;
  response: TResponse;
}

export interface WebSocketMessageDefinition<TData = any, TResponse = any> {
  type: string;
  description: string;
  data?: TData;
  response: TResponse;
}

export interface WebSocketBroadcastDefinition<TData = any> {
  type: string;
  description: string;
  data?: TData;
}

// WebSocket broadcast types
export interface ResourceChangedData {
  url: string;
  timestamp: string;
  message: string;
}

export interface ConnectedData {
  message: string;
  timestamp: string;
}

// Files and folders response type
export interface FilesAndFoldersResponse {
  nodes: Array<{
    id: string;
    type: 'file' | 'folder';
    label: string;
    description?: string;
    status?: 'todo' | 'doing' | 'done' | 'blocked';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    timestamp?: string;
    metadata?: Record<string, any>;
    icon?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    attributes: {
      type: string;
      timestamp?: string;
      metadata?: Record<string, any>;
      directed?: boolean;
    };
  }>;
}

// Response type helpers
export type ApiResponse<T> = {
  success?: boolean;
  error?: string;
  message: string;
  timestamp: string;
} & T;

// Export the vscodeHttpAPI
export { vscodeHttpAPI } from "./vscodeExtensionHttp";

// Type aliases
export type VscodeHttpEndpoint = keyof VscodeHttpAPI;
export type VscodeHttpEndpointDefinition<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T];
export type VscodeHttpResponse<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T]['response'];
export type VscodeHttpQuery<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T] extends { query: infer Q } ? Q : never;
export type VscodeHttpParams<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T] extends { params: infer P } ? P : never;

export type StakeholderHttpAPI = _StakeholderHttpAPI;
export type StakeholderHttpEndpoint = keyof StakeholderHttpAPI;
export type StakeholderHttpEndpointDefinition<T extends StakeholderHttpEndpoint> = StakeholderHttpAPI[T];
export type StakeholderHttpResponse<T extends StakeholderHttpEndpoint> = StakeholderHttpAPI[T]['response'];

export type VscodeWsAPI = _VscodeWsAPI;
export type VscodeWsMessage = keyof VscodeWsAPI;
export type VscodeWsMessageDefinition<T extends VscodeWsMessage> = VscodeWsAPI[T];
export type VscodeWsResponse<T extends VscodeWsMessage> = VscodeWsAPI[T]['response'];
export type VscodeWsData<T extends VscodeWsMessage> = VscodeWsAPI[T] extends { data: infer D } ? D : never;

// Add lock-related types
export interface LockStatusData {
  hasLockedFiles: boolean;
  lockedFiles: Array<{
    fileId: string;
    lockOwner: string;
    lockType: 'read' | 'write' | 'exclusive';
    lockTimestamp: string;
  }>;
  lockedCount: number;
  message: string;
}

export interface FilesLockedData {
  message: string;
  timestamp: string;
  lockedCount: number;
}

export interface FilesUnlockedData {
  message: string;
  timestamp: string;
  unlockedCount: number;
}

// stakeholderWsAPI with proper typing
export const stakeholderWsAPI = {
  // WebSocket broadcasts from server to clients
  resourceChanged: {
    type: 'resourceChanged' as const,
    description: 'Notify that a resource has changed',
    data: {} as ResourceChangedData
  },

  connected: {
    type: 'connected' as const,
    description: 'Connection established',
    data: {} as ConnectedData
  },

  graphUpdated: {
    type: 'graphUpdated' as const,
    description: 'Notify that the graph has been updated',
    data: {} as any
  },

  // Lock-related WebSocket broadcasts
  filesLocked: {
    type: 'filesLocked' as const,
    description: 'Notify that files have been locked',
    data: {} as FilesLockedData
  },

  filesUnlocked: {
    type: 'filesUnlocked' as const,
    description: 'Notify that files have been unlocked',
    data: {} as FilesUnlockedData
  },

  lockStatusChanged: {
    type: 'lockStatusChanged' as const,
    description: 'Notify that lock status has changed',
    data: {} as LockStatusData
  },

  // Client to server messages
  subscribeToSlice: {
    type: 'subscribeToSlice' as const,
    description: 'Subscribe to updates for a specific slice',
    data: {} as { slicePath: string }
  },

  unsubscribeFromSlice: {
    type: 'unsubscribeFromSlice' as const,
    description: 'Unsubscribe from updates for a specific slice',
    data: {} as { slicePath: string }
  },

  // Server to client messages
  subscribedToSlice: {
    type: 'subscribedToSlice' as const,
    description: 'Confirmation of subscription to a slice',
    data: {} as { slicePath: string; message: string }
  },

  unsubscribedFromSlice: {
    type: 'unsubscribedFromSlice' as const,
    description: 'Confirmation of unsubscription from a slice',
    data: {} as { slicePath: string; message: string }
  },

  error: {
    type: 'error' as const,
    description: 'Error message',
    data: {} as { message: string }
  },


  // HTTP endpoint definitions with check functions
  files: {
    type: 'files' as const,
    description: 'Get files and folders slice',
    data: {} as { slicePath: string; message: string },
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'files' && request.method === 'GET'
    }
  },

  processes: {
    type: 'processes' as const,
    description: 'Get processes slice',
    data: {} as { slicePath: string; message: string },
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'process' && request.method === 'GET'
    }
  },

  aider: {
    type: 'aider' as const,
    description: 'Get aider slice',
    data: {} as { slicePath: string; message: string },
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'aider' && request.method === 'GET'
    }
  },

  runtime: {
    type: 'runtime' as const,
    description: 'Get runtime slice',
    data: {} as { slicePath: string; message: string },
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'runtime' && request.method === 'GET'
    }
  },


} as const;

// Type for stakeholderWsAPI
export type StakeholderWsAPI = typeof stakeholderWsAPI;
export type StakeholderWsMessage = keyof StakeholderWsAPI;
export type StakeholderWsMessageDefinition<T extends StakeholderWsMessage> = StakeholderWsAPI[T];

// Helper to get data type for a broadcast
export type StakeholderWsData<T extends StakeholderWsMessage> =
  StakeholderWsAPI[T]['data'];

export interface GraphDataResponse {
  graphData: any;
  message: string;
  timestamp?: string;
}

// Unified HTTP API that includes all endpoints
export const unifiedHttpAPI = {
  ...vscodeHttpAPI,
  // Add other HTTP APIs here when needed
} as const;

export type UnifiedHttpAPI = typeof unifiedHttpAPI;
export type UnifiedHttpEndpoint = keyof UnifiedHttpAPI;
export type UnifiedHttpEndpointDefinition<T extends UnifiedHttpEndpoint> = UnifiedHttpAPI[T];
export type UnifiedHttpResponse<T extends UnifiedHttpEndpoint> = UnifiedHttpAPI[T]['response'];

// Note: WebSocket API is defined separately in stakeholderWsAPI
// HTTP API for VS Code is defined in vscodeExtensionHttp.ts

// export const matchRoutes = (routeName: string, f) => {
//   return routeName === vscodeHttpAPI.getFiles.path.slice(3) && request.method === vscodeHttpAPI.getFiles.method
// }
