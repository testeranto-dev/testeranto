import { handleProcessRoute } from "../handleProcessRoute";
import { handleAiderRoute } from "../handleAiderRoute";
import { handleRuntimeRoute } from "../handleRuntimeRoute";
import * as gitHandlers from "../../git/gitHandlers";
import * as lockHandlers from "../../lock/lockHandlers";
import * as serviceHandlers from "../../lock/serviceHandlers";

export function getRouteHandlers() {
  return {
    files: {
      handle: (handleFilesRoute: () => Response) => handleFilesRoute(),
    },
    process: {
      handle: (handleGetProcesses: () => Promise<Response>) => handleGetProcesses(),
    },
    aider: {
      handle: (graphManager: any) => handleAiderRoute(graphManager),
    },
    runtime: {
      handle: (graphManager: any) => handleRuntimeRoute(graphManager),
    },
    agents: {
      handle: (handleAgentRoute: (routeName: string, request: Request) => Promise<Response>) => 
        handleAgentRoute('', new Request('http://localhost')),
    },
    'user-agents': {
      handle: (handleUserAgentsRoute: () => Response) => handleUserAgentsRoute(),
    },
    chat: {
      handle: (handleChatRoute: (request: Request, url: URL) => Response) => 
        handleChatRoute(new Request('http://localhost'), new URL('http://localhost')),
    },
    'lock-status': {
      handle: (server: any) => lockHandlers.handleLockStatusRoute(server),
    },
    down: {
      handle: (server: any) => serviceHandlers.handleDown(server),
    },
    up: {
      handle: (server: any) => serviceHandlers.handleUp(server),
    },
    'git/status': {
      handle: () => gitHandlers.handleGitStatus(),
    },
    'git/switch-branch': {
      handle: () => gitHandlers.handleGitSwitchBranch(new Request('http://localhost')),
    },
    'git/commit': {
      handle: () => gitHandlers.handleGitCommit(new Request('http://localhost')),
    },
    'git/merge': {
      handle: () => gitHandlers.handleGitMerge(new Request('http://localhost')),
    },
    'git/conflicts': {
      handle: () => gitHandlers.handleGitConflicts(),
    },
    'git/resolve-conflict': {
      handle: () => gitHandlers.handleGitResolveConflict(new Request('http://localhost')),
    },
    'open-process-terminal': {
      handle: (handleOpenProcessTerminal: (request: Request) => Promise<Response>) => 
        handleOpenProcessTerminal(new Request('http://localhost')),
    },
    'add-chat-message': {
      handle: (handleAddChatMessage: (request: Request) => Promise<Response>) => 
        handleAddChatMessage(new Request('http://localhost')),
    },
    'process-logs': {
      handle: (handleProcessLogsRoute: (request: Request) => Promise<Response>) => 
        handleProcessLogsRoute(new Request('http://localhost')),
    },
  };
}
