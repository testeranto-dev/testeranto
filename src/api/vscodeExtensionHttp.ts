
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