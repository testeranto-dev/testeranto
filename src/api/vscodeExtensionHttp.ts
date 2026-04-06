// VS Code extension HTTP API definitions

import type { FilesAndFoldersResponse } from "./api";

// import type { FilesAndFoldersResponse } from "../api";

export const vscodeHttpAPI = {
  // Get the current graph state
  getGraph: {
    method: 'GET' as const,
    path: '/~/graph',
    description: 'Get current graph state',
    response: {} as any
  },
  // Update graph with operations
  updateGraph: {
    method: 'POST' as const,
    path: '/~/graph',
    description: 'Update graph with operations',
    response: {} as any
  },
  // Get only files and folders
  getFiles: {
    method: 'GET' as const,
    path: '/~/files',
    description: 'Get only files and folders from the graph',
    response: {} as FilesAndFoldersResponse
  },

  // // TODO replicate this pattern
  // files: {
  //   type: 'files' as const,
  //   description: 'subscribe for files',
  //   data: {} as { slicePath: string; message: string },
  //   check: (routeName: string, request: { method: string }) => {
  //     return routeName === vscodeHttpAPI.getFiles.path.slice(3) && request.method === vscodeHttpAPI.getFiles.method
  //   },

  //   // TODO replicate this pattern
  //   processes: {
  //     type: 'processes' as const,
  //     description: 'subscribe for processes',
  //     data: {} as { slicePath: string; message: string },
  //     check: (routeName: string, request: { method: string }) => {
  //       return routeName === 'process' && request.method === 'GET'
  //     },
  //   }
  // }

} as const;

export type VscodeHttpAPI = typeof vscodeHttpAPI;
export type VscodeHttpEndpoint = keyof VscodeHttpAPI;
export type VscodeHttpEndpointDefinition<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T];
export type VscodeHttpResponse<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T]['response'];
export type VscodeHttpQuery<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T] extends { query: infer Q } ? Q : never;
export type VscodeHttpParams<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T] extends { params: infer P } ? P : never;
import type { ApiEndpointDefinition } from "./api";

// Define the VS Code HTTP API endpoints
export interface VscodeHttpAPI {
  getConfigs: ApiEndpointDefinition<
    {}, // No params
    {}, // No query
    {
      configs: {
        runtimes: Record<string, {
          runtime: string;
          tests: string[];
          dockerfile: string;
          buildOptions: string;
          checks: ((x: string[]) => string)[];
          outputs: string[];
          buildKitOptions?: {
            cacheMounts?: string[];
            multiStage?: boolean;
            targetStage?: string;
            buildArgs?: Record<string, string>;
          };
        }>;
        volumes: string[];
        featureIngestor: (s: string) => Promise<{ data: string; filepath: string }>;
        agents?: Record<string, any>;
      };
      message: string;
      timestamp: string;
    }
  >;

  getProcesses: ApiEndpointDefinition<
    {}, // No params
    {}, // No query
    {
      processes: Array<{
        id: string;
        name: string;
        runtime: string;
        testName: string;
        configKey: string;
        status: 'running' | 'stopped' | 'exited' | 'failed';
        exitCode?: number;
        containerId?: string;
        serviceName?: string;
        startedAt?: string;
        finishedAt?: string;
      }>;
      message: string;
      timestamp: string;
    }
  >;

  getProcessLogs: ApiEndpointDefinition<
    { processId: string }, // params
    {}, // No query
    {
      logs: string[];
      processId: string;
      status: string;
      exitCode?: number;
      message: string;
      timestamp: string;
    }
  >;

  getAiderProcesses: ApiEndpointDefinition<
    {}, // No params
    {}, // No query
    {
      aiderProcesses: Array<{
        id: string;
        containerId: string;
        containerName: string;
        runtime: string;
        testName: string;
        configKey: string;
        isActive: boolean;
        status: 'running' | 'stopped' | 'exited';
        exitCode?: number;
        startedAt?: string;
        lastActivity?: string;
      }>;
      message: string;
      timestamp: string;
    }
  >;

  getHtmlReport: ApiEndpointDefinition<
    {}, // No params
    {}, // No query
    {
      html: string;
      message: string;
      timestamp: string;
    }
  >;

  getAppState: ApiEndpointDefinition<
    {}, // No params
    {}, // No query
    {
      state: {
        serverRunning: boolean;
        mode: 'dev' | 'once' | 'test';
        timestamp: string;
        version: string;
        runtimes: string[];
        activeTests: number;
        totalTests: number;
      };
      message: string;
      timestamp: string;
    }
  >;

  getUnifiedTestTree: ApiEndpointDefinition<
    {}, // No params
    {}, // No query
    {
      tree: Record<string, any>;
      message: string;
      timestamp: string;
    }
  >;
}

// Implementation of the VS Code HTTP API
export const vscodeHttpAPI: {
  [K in keyof VscodeHttpAPI]: VscodeHttpAPI[K] & {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  }
} = {
  getConfigs: {
    method: 'GET',
    path: '/~/configs',
    description: 'Get all configuration data',
    params: {},
    query: {},
    response: {} as any
  },

  getProcesses: {
    method: 'GET',
    path: '/~/processes',
    description: 'Get all running processes',
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
  }
} as const;
