// WebSocket API for VS Code extension - unified with stakeholder API
// All WebSocket communication uses the common stakeholderWsAPI

export const vscodeWsAPI = {
  getUnifiedTestTree: {
    type: 'getUnifiedTestTree'
  },
  sourceFilesUpdated: {
    type: 'sourceFilesUpdated'
  },
  getBuildListenerState: {
    type: 'getBuildListenerState'
  },
  getBuildEvents: {
    type: 'getBuildEvents'
  }
} as const;

// Resource change notification paths
export const resourcePaths = {
  graph: '/~/graph'
} as const;
