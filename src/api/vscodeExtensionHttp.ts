
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

export interface HtmlReportResponse {
  message: string;
  url: string;
}

export interface AppStateResponse {
  appState: any;
  message: string;
}

export interface UnifiedTestTreeResponse {
  tree: Record<string, any>;
  message: string;
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

  getUnifiedTestTree: {
    method: 'GET' as const,
    path: '/~/unified-test-tree',
    description: 'Get unified test tree organized by runtime and test',
    response: {} as UnifiedTestTreeResponse
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

  // HTML report
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
