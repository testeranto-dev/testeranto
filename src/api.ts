// Base API definition types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

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

// Response type helpers
export type ApiResponse<T> = {
  success?: boolean;
  error?: string;
  message: string;
  timestamp: string;
} & T;

// Specific response types for each endpoint
export interface ConfigsResponse {
  configs: any; // ITesterantoConfig
  message: string;
}

export interface ProcessesResponse {
  processes: any[];
  total: number;
  message: string;
}

export interface ProcessLogsResponse {
  logs: any[];
  status: string;
  message: string;
}

export interface AiderProcessesResponse {
  aiderProcesses: any[];
  message: string;
}

export interface InputFilesResponse {
  runtime: string;
  testName: string;
  inputFiles: string[];
  message: string;
}

export interface OutputFilesResponse {
  runtime: string;
  testName: string;
  outputFiles: string[];
  message: string;
}

export interface TestResultsResponse {
  testResults: any[];
  message: string;
}

export interface CollatedTestResultsResponse {
  collatedTestResults: Record<string, any>;
  message: string;
}

export interface CollatedInputFilesResponse {
  collatedInputFiles: Record<string, any>;
  fsTree: any;
  message: string;
}

export interface CollatedFilesResponse {
  tree: Record<string, any>;
  message: string;
}

export interface CollatedDocumentationResponse {
  tree: any;
  files: string[];
  message: string;
}

export interface DocumentationResponse {
  files: string[];
  message: string;
}

export interface ReportsResponse {
  tree: any;
  message: string;
}

export interface HtmlReportResponse {
  message: string;
  url: string;
}

export interface AppStateResponse {
  appState: any;
  message: string;
}

export interface GraphDataResponse {
  success: boolean;
  timestamp: string;
  data: any;
}

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

// vscodeHttpAPI with proper typing
export const vscodeHttpAPI = {
  // Configuration and metadata
  getConfigs: {
    method: 'GET' as const,
    path: '/~/configs',
    description: 'Get server configuration',
    response: {} as ConfigsResponse
  },
  
  getProcesses: {
    method: 'GET' as const,
    path: '/~/processes',
    description: 'Get running processes summary',
    response: {} as ProcessesResponse
  },
  
  getProcessLogs: {
    method: 'GET' as const,
    path: '/~/process-logs/:processId',
    description: 'Get logs for a specific process',
    params: {
      processId: 'string'
    },
    response: {} as ProcessLogsResponse
  },
  
  getAiderProcesses: {
    method: 'GET' as const,
    path: '/~/aider-processes',
    description: 'Get aider processes',
    response: {} as AiderProcessesResponse
  },
  
  // Test file management
  getInputFiles: {
    method: 'GET' as const,
    path: '/~/inputfiles',
    description: 'Get input files for a test',
    query: {
      runtime: 'string',
      testName: 'string'
    },
    response: {} as InputFilesResponse
  },
  
  getOutputFiles: {
    method: 'GET' as const,
    path: '/~/outputfiles',
    description: 'Get output files for a test',
    query: {
      runtime: 'string',
      testName: 'string'
    },
    response: {} as OutputFilesResponse
  },
  
  // Test results
  getTestResults: {
    method: 'GET' as const,
    path: '/~/testresults',
    description: 'Get test results',
    query: {
      runtime: 'string?',
      testName: 'string?'
    },
    response: {} as TestResultsResponse
  },
  
  getCollatedTestResults: {
    method: 'GET' as const,
    path: '/~/collated-testresults',
    description: 'Get collated test results',
    response: {} as CollatedTestResultsResponse
  },
  
  getCollatedInputFiles: {
    method: 'GET' as const,
    path: '/~/collated-inputfiles',
    description: 'Get collated input files',
    response: {} as CollatedInputFilesResponse
  },
  
  getCollatedFiles: {
    method: 'GET' as const,
    path: '/~/collated-files',
    description: 'Get collated files tree',
    response: {} as CollatedFilesResponse
  },
  
  // Documentation
  getCollatedDocumentation: {
    method: 'GET' as const,
    path: '/~/collated-documentation',
    description: 'Get collated documentation',
    response: {} as CollatedDocumentationResponse
  },
  
  getDocumentation: {
    method: 'GET' as const,
    path: '/~/documentation',
    description: 'Get documentation files',
    response: {} as DocumentationResponse
  },
  
  // Reports
  getReports: {
    method: 'GET' as const,
    path: '/~/reports',
    description: 'Get reports tree',
    response: {} as ReportsResponse
  },
  
  getHtmlReport: {
    method: 'GET' as const,
    path: '/~/html-report',
    description: 'Get HTML report info',
    response: {} as HtmlReportResponse
  },
  
  // App state
  getAppState: {
    method: 'GET' as const,
    path: '/~/app-state',
    description: 'Get application state',
    response: {} as AppStateResponse
  }
} as const;

// Type for vscodeHttpAPI
export type VscodeHttpAPI = typeof vscodeHttpAPI;
export type VscodeHttpEndpoint = keyof VscodeHttpAPI;
export type VscodeHttpEndpointDefinition<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T];

// Helper to get response type for an endpoint
export type VscodeHttpResponse<T extends VscodeHttpEndpoint> = 
  VscodeHttpAPI[T]['response'];

// Helper to get query params type for an endpoint
export type VscodeHttpQuery<T extends VscodeHttpEndpoint> = 
  VscodeHttpAPI[T] extends { query: infer Q } ? Q : never;

// Helper to get path params type for an endpoint
export type VscodeHttpParams<T extends VscodeHttpEndpoint> = 
  VscodeHttpAPI[T] extends { params: infer P } ? P : never;

// stakeholderHttpAPI with proper typing
export const stakeholderHttpAPI = {
  // Graph data endpoints
  getGraphData: {
    method: 'GET' as const,
    path: '/api/graph-data',
    description: 'Get graph data for visualization (API mode only)',
    response: {} as GraphDataResponse
  },
  
  getGraphDataJson: {
    method: 'GET' as const,
    path: '/graph-data.json',
    description: 'Get graph data as JSON file (static mode)',
    response: {} as any // Raw JSON data
  }
} as const;

// Type for stakeholderHttpAPI
export type StakeholderHttpAPI = typeof stakeholderHttpAPI;
export type StakeholderHttpEndpoint = keyof StakeholderHttpAPI;
export type StakeholderHttpEndpointDefinition<T extends StakeholderHttpEndpoint> = StakeholderHttpAPI[T];

// Helper to get response type for an endpoint
export type StakeholderHttpResponse<T extends StakeholderHttpEndpoint> = 
  StakeholderHttpAPI[T]['response'];

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
  }
} as const;

// Type for vscodeWsAPI
export type VscodeWsAPI = typeof vscodeWsAPI;
export type VscodeWsMessage = keyof VscodeWsAPI;
export type VscodeWsMessageDefinition<T extends VscodeWsMessage> = VscodeWsAPI[T];

// Helper to get response type for a message
export type VscodeWsResponse<T extends VscodeWsMessage> = 
  VscodeWsAPI[T]['response'];

// Helper to get data type for a message
export type VscodeWsData<T extends VscodeWsMessage> = 
  VscodeWsAPI[T] extends { data: infer D } ? D : never;

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
  }
} as const;

// Type for stakeholderWsAPI
export type StakeholderWsAPI = typeof stakeholderWsAPI;
export type StakeholderWsMessage = keyof StakeholderWsAPI;
export type StakeholderWsMessageDefinition<T extends StakeholderWsMessage> = StakeholderWsAPI[T];

// Helper to get data type for a broadcast
export type StakeholderWsData<T extends StakeholderWsMessage> = 
  StakeholderWsAPI[T]['data'];
