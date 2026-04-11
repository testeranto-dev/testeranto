// VS Code extension HTTP API definitions

import type { FilesAndFoldersResponse } from "./api";

// import type { FilesAndFoldersResponse } from "../api";

// export const vscodeHttpAPI = {
//   // Get the current graph state
//   getGraph: {
//     method: 'GET' as const,
//     path: '/~/graph',
//     description: 'Get current graph state',
//     response: {} as any
//   },
//   // Update graph with operations
//   updateGraph: {
//     method: 'POST' as const,
//     path: '/~/graph',
//     description: 'Update graph with operations',
//     response: {} as any
//   },
//   // Get only files and folders
//   getFiles: {
//     method: 'GET' as const,
//     path: '/~/files',
//     description: 'Get only files and folders from the graph',
//     response: {} as FilesAndFoldersResponse
//   },

//   // // TODO replicate this pattern
//   // files: {
//   //   type: 'files' as const,
//   //   description: 'subscribe for files',
//   //   data: {} as { slicePath: string; message: string },
//   //   check: (routeName: string, request: { method: string }) => {
//   //     return routeName === vscodeHttpAPI.getFiles.path.slice(3) && request.method === vscodeHttpAPI.getFiles.method
//   //   },

//   //   // TODO replicate this pattern
//   //   processes: {
//   //     type: 'processes' as const,
//   //     description: 'subscribe for processes',
//   //     data: {} as { slicePath: string; message: string },
//   //     check: (routeName: string, request: { method: string }) => {
//   //       return routeName === 'process' && request.method === 'GET'
//   //     },
//   //   }
//   // }

// } as const;

// export type VscodeHttpAPI = typeof vscodeHttpAPI;
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
    path: '/~/agents',
    description: 'Get all agents',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'agents' && request.method === 'GET'
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
    response: {} as any,
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
    response: {} as any,
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
    response: {} as any,
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
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'runtime' && request.method === 'GET'
    }
  },

  getVscodeView: {
    method: 'GET',
    path: '/~/vscode-views/:viewName',
    description: 'Get vscode view data',
    params: {
      viewName: ''
    },
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName.startsWith('vscode-views/') && request.method === 'GET'
    }
  },

  getStakeholderView: {
    method: 'GET',
    path: '/~/stakeholder-views/:viewName',
    description: 'Get stakeholder view data',
    params: {
      viewName: ''
    },
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName.startsWith('stakeholder-views/') && request.method === 'GET'
    }
  },

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

  addChatMessage: {
    method: 'POST',
    path: '/~/add-chat-message',
    description: 'Add a chat message to the graph',
    params: {},
    query: {},
    response: {} as any,
    check: (routeName: string, request: { method: string }) => {
      return routeName === 'add-chat-message' && request.method === 'POST'
    }
  }
} as const;
