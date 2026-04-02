// WebSocket response types
export interface PingResponse {
  type: 'pong';
  timestamp: string;
}

export interface UseHttpResponse {
  type: 'useHttp';
  message: string;
  timestamp: string;
}

export interface SourceFilesUpdatedResponse {
  type: 'sourceFilesUpdated';
  testName: string;
  hash: string;
  files: string[];
  runtime: string;
  status: string;
  timestamp: string;
  message: string;
}

export interface BuildListenerStateResponse {
  type: 'buildListenerState';
  data: any;
  timestamp: string;
}

export interface BuildEventsResponse {
  type: 'buildEvents';
  events: any[];
  timestamp: string;
}

export interface LogsResponse {
  type: 'logs';
  processId: string;
  logs: any[];
  timestamp: string;
}

export interface LogSubscriptionResponse {
  type: 'logSubscription';
  status: string;
  processId: string;
  timestamp: string;
}

export interface UnifiedTestTreeResponse {
  type: 'unifiedTestTree';
  tree: Record<string, any>;
  timestamp: string;
}

// vscodeWsAPI with proper typing
export const vscodeWsAPI = {
  // WebSocket message types
  ping: {
    type: 'ping' as const,
    description: 'Ping to check connection',
    response: {} as PingResponse
  },

  getProcesses: {
    type: 'getProcesses' as const,
    description: 'Get processes (redirects to HTTP)',
    response: {} as UseHttpResponse
  },

  sourceFilesUpdated: {
    type: 'sourceFilesUpdated' as const,
    description: 'Notify that source files have been updated',
    data: {
      testName: 'string',
      hash: 'string',
      files: 'string[]',
      runtime: 'string'
    },
    response: {} as SourceFilesUpdatedResponse
  },

  getBuildListenerState: {
    type: 'getBuildListenerState' as const,
    description: 'Get build listener state',
    response: {} as BuildListenerStateResponse
  },

  getBuildEvents: {
    type: 'getBuildEvents' as const,
    description: 'Get build events',
    response: {} as BuildEventsResponse
  },

  // Add missing WebSocket message types
  getLogs: {
    type: 'getLogs' as const,
    description: 'Get logs for a specific process',
    data: {
      processId: 'string'
    },
    response: {} as LogsResponse
  },

  subscribeToLogs: {
    type: 'subscribeToLogs' as const,
    description: 'Subscribe to logs for a specific process',
    data: {
      processId: 'string'
    },
    response: {} as LogSubscriptionResponse
  },

  // Unified test tree
  getUnifiedTestTree: {
    type: 'getUnifiedTestTree' as const,
    description: 'Get unified test tree organized by runtime and test',
    response: {} as UnifiedTestTreeResponse
  }
} as const;
