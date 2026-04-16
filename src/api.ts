export type IFileRouteResponse = {
  nodes?: Array<{
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
  edges?: Array<{
    source: string;
    target: string;
    attributes: {
      type: string;
      timestamp?: string;
      metadata?: Record<string, any>;
      directed?: boolean;
    };
  }>;
  tree: any;
  timestamp: string;
}

export const wsApi = {
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

  // WebSocket slice names (for subscription)
  slices: {
    files: '/files' as const,
    process: '/process' as const,
    aider: '/aider' as const,
    runtime: '/runtime' as const,
    agents: '/agents' as const,
    graph: '/graph' as const,
    views: '/views' as const,
    chat: '/chat' as const,
  },

  error: {
    type: 'error' as const,
    description: 'Error message',
    data: {} as { message: string }
  },


  // HTTP endpoint definitions with check functions
  // someday, you can list files, edit, create and destroy files
  // but for now, focus on just listing them
  files: {
    type: 'files' as const,
    description: 'Get files and folders slice',
    data: {} as { slicePath: string; message: string },
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'files' && request.method === 'GET'
    }
  },

  // you can GET and CREATE files
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

// Implementation of the HTTP API
export const API: {
  [K in keyof any]: any[K] & {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  }
} = {

  // TODO 
  // spawnAgent: {
  //   agent: string,
  //   loadfile: string,
  //   message: string
  // },

  getConfigs: {
    method: 'GET',
    path: '/~/configs',
    description: 'Get all configuration data',
    params: {},
    query: {},
    response: {} as any
  },

  getProcessLogs: {
    method: 'GET',
    path: '/~/processes/:processId/logs',
    description: 'Get logs for a specific process',
    params: { processId: '' },
    query: {},
    response: {} as any
  },

  getAiderProcesses: {
    method: 'GET',
    path: '/~/aider-processes',
    description: 'Get all aider processes',
    params: {},
    query: {},
    response: {} as any
  },

  getHtmlReport: {
    method: 'GET',
    path: '/~/html-report',
    description: 'Get the HTML report',
    params: {},
    query: {},
    response: {} as any
  },

  getAppState: {
    method: 'GET',
    path: '/~/app-state',
    description: 'Get the application state',
    params: {},
    query: {},
    response: {} as any
  },

  getUnifiedTestTree: {
    method: 'GET',
    path: '/~/unified-test-tree',
    description: 'Get the unified test tree',
    params: {},
    query: {},
    response: {} as any
  },

  getLockStatus: {
    method: 'GET',
    path: '/~/lock-status',
    description: 'Get lock status for files',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'lock-status' && request.method === 'GET'
    }
  },

  // Note: According to tickets/chat.md, we no longer need POST endpoint for chat
  // Chat is now handled via WebSocket messages

  launchAgent: {
    method: 'POST',
    path: '/~/agents/:agentName',
    description: 'Launch a new agent instance',
    params: {
      agentName: ''
    },
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName.startsWith('agents/') && request.method === 'POST'
    }
  },

  getAgents: {
    method: 'GET',
    path: '/~/agents/:agentName',
    description: 'Get a specific agent by name',
    params: {
      agentName: ''
    },
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName.startsWith('agents/') && request.method === 'GET'
    }
  },

  getUserAgents: {
    method: 'GET',
    path: '/~/user-agents',
    description: 'Get user-defined agents from config',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'user-agents' && request.method === 'GET'
    }
  },

  getAllAgents: {
    method: 'GET',
    path: '/~/agents',
    description: 'Get all agents',
    params: {},
    query: {},
    response: {} as GetAgentsResponse,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'agents' && request.method === 'GET'
    }
  },
  getAgentSlice: {
    method: 'GET',
    path: '/~/agents/:agentName',
    description: 'Get agent slice data',
    params: {
      agentName: ''
    },
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName.startsWith('agents/') && request.method === 'GET'
    }
  },

  getFiles: {
    method: 'GET',
    path: '/~/files',
    description: 'Get files and folders slice',
    params: {},
    query: {},
    response: {} as GetFilesResponse,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'files' && request.method === 'GET'
    }
  },

  getProcess: {
    method: 'GET',
    path: '/~/process',
    description: 'Get processes slice',
    params: {},
    query: {},
    response: {} as GetProcessResponse,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'process' && request.method === 'GET'
    }
  },

  getAider: {
    method: 'GET',
    path: '/~/aider',
    description: 'Get aider slice',
    params: {},
    query: {},
    response: {} as GetAiderResponse,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'aider' && request.method === 'GET'
    }
  },

  getRuntime: {
    method: 'GET',
    path: '/~/runtime',
    description: 'Get runtime slice',
    params: {},
    query: {},
    response: {} as GetRuntimeResponse,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'runtime' && request.method === 'GET'
    }
  },

  getView: {
    method: 'GET',
    path: '/~/views/:viewName',
    description: 'Get view data',
    params: {
      viewName: ''
    },
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName.startsWith('views/') && request.method === 'GET'
    }
  },

  // getViewWithGraph: {
  //   method: 'GET',
  //   path: '/~/views-with-graph/:viewName',
  //   description: 'Get view data with graph data',
  //   params: {
  //     viewName: ''
  //   },
  //   query: {},
  //   response: {} as any,
  //   check: (routeName: string, request: { method: string }) => {
  //     return routeName.startsWith('views-with-graph/') && request.method === 'GET'
  //   }
  // },

  gitStatus: {
    method: 'GET',
    path: '/~/git/status',
    description: 'Get git status',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'git/status' && request.method === 'GET'
    }
  },

  gitSwitchBranch: {
    method: 'POST',
    path: '/~/git/switch-branch',
    description: 'Switch git branch',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'git/switch-branch' && request.method === 'POST'
    }
  },

  gitCommit: {
    method: 'POST',
    path: '/~/git/commit',
    description: 'Commit changes',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'git/commit' && request.method === 'POST'
    }
  },

  gitMerge: {
    method: 'POST',
    path: '/~/git/merge',
    description: 'Merge branch',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'git/merge' && request.method === 'POST'
    }
  },

  gitConflicts: {
    method: 'GET',
    path: '/~/git/conflicts',
    description: 'Get merge conflicts',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'git/conflicts' && request.method === 'GET'
    }
  },

  gitResolveConflict: {
    method: 'POST',
    path: '/~/git/resolve-conflict',
    description: 'Resolve merge conflict',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'git/resolve-conflict' && request.method === 'POST'
    }
  },

  down: {
    method: 'POST',
    path: '/~/down',
    description: 'Stop services and lock files',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'down' && request.method === 'POST'
    }
  },

  up: {
    method: 'POST',
    path: '/~/up',
    description: 'Start services and unlock files',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'up' && request.method === 'POST'
    }
  },

  openProcessTerminal: {
    method: 'POST',
    path: '/~/open-process-terminal',
    description: 'Open a terminal to a process container',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'open-process-terminal' && request.method === 'POST'
    }
  },

  // Chat operations
  postChatMessage: {
    method: 'POST',
    path: '/~/chat',
    description: 'Add a chat message to the graph',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'chat' && request.method === 'POST'
    }
  },
  getChatHistory: {
    method: 'GET',
    path: '/~/chat',
    description: 'Get chat history',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'chat' && request.method === 'GET'
    }
  },
  startProcess: {
    method: 'POST',
    path: '/~/start-process',
    description: 'Start a Docker process for testing',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'start-process' && request.method === 'POST'
    }
  },
} as const;


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

// Define response types for each endpoint
export interface GetFilesResponse {
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
  tree?: any;
  timestamp?: string;
}

export interface GetAiderResponse {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    metadata?: Record<string, any>;
  }>;
  edges?: Array<{
    source: string;
    target: string;
    attributes: {
      type: string;
    };
  }>;
}

export interface GetAgentsResponse {
  agents: Array<{
    name?: string;
    key?: string;
    config?: {
      message?: string;
      load?: string[];
    };
  }>;
}

export interface GetProcessResponse {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    metadata?: Record<string, any>;
  }>;
  edges?: Array<{
    source: string;
    target: string;
    attributes: {
      type: string;
    };
  }>;
}

export interface GetRuntimeResponse {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    metadata?: Record<string, any>;
  }>;
  edges?: Array<{
    source: string;
    target: string;
    attributes: {
      type: string;
    };
  }>;
}



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



// // Type for stakeholderWsAPI
// export type StakeholderWsAPI = typeof stakeholderWsAPI;
// export type StakeholderWsMessage = keyof StakeholderWsAPI;
// export type StakeholderWsMessageDefinition<T extends StakeholderWsMessage> = StakeholderWsAPI[T];

// // Helper to get data type for a broadcast
// export type StakeholderWsData<T extends StakeholderWsMessage> =
//   StakeholderWsAPI[T]['data'];

export interface GraphDataResponse {
  graphData: any;
  message: string;
  timestamp?: string;
}

// Note: WebSocket API is defined separately in wsApi
// HTTP API is defined in API object above

// Utility function to get API URL
export function getApiUrl<K extends keyof typeof API>(endpoint: K, params?: Record<string, string>): string {
  const apiDef = API[endpoint];
  let path = apiDef.path;

  // Replace path parameters
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    }
  }

  // For VSCode extension, we need to construct the full URL
  // Since the server runs on localhost:3000
  const baseUrl = 'http://localhost:3000';
  return `${baseUrl}${path}`;
}

// Utility function to get just the API path
export function getApiPath<K extends keyof typeof API>(endpoint: K, params?: Record<string, string>): string {
  const apiDef = API[endpoint];
  let path = apiDef.path;

  // Replace path parameters
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    }
  }

  return path;
}

// Utility to check if an endpoint matches a route
export function matchApiRoute(routeName: string, method: string): keyof typeof API | null {
  for (const [key, endpoint] of Object.entries(API)) {
    // Remove leading /~/
    const endpointPath = endpoint.path.replace('/~/', '');
    if (endpointPath === routeName && endpoint.method === method) {
      return key as keyof typeof API;
    }
  }
  return null;
}

// export const matchRoutes = (routeName: string, f) => {
//   return routeName === API.getFiles.path.slice(3) && request.method === API.getFiles.method
// }
