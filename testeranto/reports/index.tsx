// NOTE: this file is not a part of our build process, but a downstream process run by the user
// this file is copied to the users project where they can customize it
// This is where a user configures the visualization.

import React, { useState } from "react";
import ReactDOM from "react-dom/client";

// IMPORTANT : all imports need tog through testeranto/stakeholderApp
import {
  VisualizationTabs,
} from "testeranto/stakeholderApp/VisualizationTabs.tsx";
// import { window } from "vscode";
import { StakeholderGraphClient } from "testeranto/stakeholderApp/graph/index.ts";
import { sendGraphUpdate } from "testeranto/stakeholderApp/utils/graphUpdate.ts"


// Determine if we're in development mode (server API available)
// In development, we can use WebSocket for live updates
// In static mode, we load only from graph-data.json file
const isDevelopmentMode = typeof window !== 'undefined' &&
  window.location.hostname.includes('localhost') &&
  window.location.protocol.startsWith('http');

console.log(`[StakeholderApp] Mode: ${isDevelopmentMode ? 'Development (WebSocket enabled)' : 'Static (read-only)'}`);

// Export views for use in testeranto.ts
export { EisenhowerMatrix, GanttChart, KanbanBoard } from '../../src/views/defaultViews';
export type { EisenhowerConfig, GanttConfig, KanbanConfig } from '../../src/views/defaultViews';

// Import types from the graph module
import type { GraphData } from '../graph/index';

// Types that should match those in src/api.ts
// For proper type safety, these should be imported from a shared location
export interface StakeholderData {
  documentation: {
    files: string[];
    timestamp?: number;
    contents?: Record<string, string>;
  };
  testResults: Record<string, any>;
  errors: Array<{
    configKey: string;
    testName: string;
    message: string;
    lastAttempt?: any;
    triedPaths?: string[];
  }>;
  configs: {
    runtimes: Record<
      string,
      {
        runtime: string;
        tests: string[];
        dockerfile: string;
      }
    >;
  };
  timestamp: string;
  workspaceRoot: string;
  allTestResults?: {
    [configKey: string]: {
      [testName: string]: any;
    };
  };
  unifiedGraph?: GraphData; // Changed from featureGraph/fileTreeGraph
  vizConfig?: any;
}


export const DefaultStakeholderApp: React.FC = () => {
  const [data, setData] = React.useState<StakeholderData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [graphClient, setGraphClient] = React.useState<StakeholderGraphClient | null>(null);
  const [wsConnected, setWsConnected] = React.useState(false);

  React.useEffect(() => {
    // Initialize graph client when data is loaded
    if (data && !graphClient) {
      const client = new StakeholderGraphClient((updatedGraphData) => {
        // Update data with new unified graph
        setData(prev => prev ? {
          ...prev,
          unifiedGraph: updatedGraphData
        } : prev);
      });
      setGraphClient(client);
    }

    return () => {
      if (graphClient) {
        graphClient.disconnect();
      }
    };
  }, [data, graphClient]);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      // Always load baseline from graph-data.json first
      // This ensures consistent baseline across all modes
      try {
        // Try multiple possible paths for graph-data.json
        const possiblePaths = [
          // 'graph-data.json',
          '/testeranto/reports/graph-data.json',
          // './graph-data.json'
        ];

        let response = null;
        let lastError = null;

        // Try each path until one works
        for (const path of possiblePaths) {
          try {
            response = await fetch(path);
            if (response.ok) break;
          } catch (err) {
            lastError = err;
            continue;
          }
        }

        if (!response || !response.ok) {
          throw new Error(`Failed to load graph-data.json from any path. Last error: ${lastError?.message || 'Unknown'}`);
        }

        const result = await response.json();

        // Handle only unified graph format
        let stakeholderData: StakeholderData;
        if (result.data && result.data.unifiedGraph) {
          // New format with unifiedGraph (GraphDataFile format)
          stakeholderData = {
            configs: result.data.configs || {},
            allTestResults: result.data.allTestResults || {},
            unifiedGraph: result.data.unifiedGraph,
            vizConfig: result.data.vizConfig || {
              projection: {
                xAttribute: 'status',
                yAttribute: 'priority',
                xType: 'categorical',
                yType: 'continuous',
                layout: 'grid'
              },
              style: {
                nodeSize: 10,
                nodeColor: '#007acc',
                nodeShape: 'circle'
              }
            },
            documentation: { files: [] },
            testResults: {},
            errors: [],
            timestamp: result.timestamp || new Date().toISOString(),
            workspaceRoot: ''
          };
          console.log('[StakeholderApp] Loaded GraphDataFile format');
        } else {
          // Old format - show error
          throw new Error('Old graph format detected. Please regenerate graph-data.json with unified format.');
        }

        setData(stakeholderData);
        setLoading(false);

      } catch (error) {
        console.error('Failed to load static graph data:', error);
        setError(error.message || 'Unknown error loading data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Loading Testeranto Stakeholder Report...</h2>
        <p>Attempting to load data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1 style={{ color: "#d32f2f" }}>Error Loading Report</h1>
        <p>{error || "No data could be loaded."}</p>
        <p>Please make sure the Testeranto server has generated the report files.</p>
      </div>
    );
  }

  const handleNodeClick = (node: Node) => {
    console.log("Node clicked:", node);
    // You can access node properties with type safety
    console.log("Node ID:", node.id);
    console.log("Node attributes:", node.attributes);
  };

  const handleNodeHover = (node: Node | null) => {
    if (node) {
      console.log("Node hover:", node.id);
    }
  };

  const handleNodeUpdate = async (nodeId: string, updatedAttributes: Record<string, any>) => {
    console.log("Node update requested:", nodeId, updatedAttributes);
    try {
      // Create update operation
      const operation = {
        type: 'updateNode' as const,
        data: {
          id: nodeId,
          ...updatedAttributes
        },
        timestamp: new Date().toISOString()
      };

      await sendGraphUpdate([operation]);
      console.log("Node update sent to server");
    } catch (error) {
      console.error("Failed to update node:", error);
      // You might want to show an error to the user
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Loading Testeranto Stakeholder Report...</h2>
        <p>Attempting to load data...</p>
        {isDevelopmentMode && <p style={{ fontSize: "0.9em", color: "#666" }}>Development mode: WebSocket will connect after loading</p>}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1 style={{ color: "#d32f2f" }}>Error Loading Report</h1>
        <p>{error || "No data could be loaded."}</p>
        <p>Please make sure the Testeranto server has generated the report files.</p>
        <p style={{ fontSize: "0.9em", color: "#666" }}>
          Mode: {isDevelopmentMode ? 'Development' : 'Static'} |
          Tried loading from: graph-data.json, /testeranto/reports/graph-data.json, ./graph-data.json
        </p>
      </div>
    );
  }

  // const handleNodeClick = (node: any) => {
  //   console.log("Node clicked:", node);
  //   // You can access node properties with type safety
  //   console.log("Node ID:", node.id);
  //   console.log("Node attributes:", node.attributes);
  // };

  // const handleNodeHover = (node: any | null) => {
  //   if (node) {
  //     console.log("Node hover:", node.id);
  //   }
  // };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Testeranto Stakeholder Report</h1>
        <div style={{ fontSize: "0.9em", color: "#666" }}>
          Mode: {isDevelopmentMode ? (
            <span style={{ color: "#2e7d32", fontWeight: "bold" }}>Development</span>
          ) : (
            <span style={{ color: "#666", fontWeight: "bold" }}>Static (read-only)</span>
          )}
          {isDevelopmentMode && (
            <div style={{ marginTop: "5px", fontSize: "0.8em" }}>
              WebSocket: {wsConnected ? (
                <span style={{ color: "#2e7d32" }}>Connected</span>
              ) : (
                <span style={{ color: "#d32f2f" }}>Disconnected</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <VisualizationTabs
          data={data}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onNodeUpdate={handleNodeUpdate}
        />
      </div>
      <div style={{ fontSize: "0.8em", color: "#666", marginTop: "30px", paddingTop: "10px", borderTop: "1px solid #eee" }}>
        <p>
          Data loaded from graph-data.json |
          Last updated: {data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Unknown'} |
          Graph nodes: {data.unifiedGraph?.nodes?.length || 0} |
          Graph edges: {data.unifiedGraph?.edges?.length || 0}
        </p>
        {!isDevelopmentMode && (
          <p style={{ fontStyle: "italic" }}>
            Note: Running in static mode. To enable live updates, run the Testeranto server locally.
          </p>
        )}
      </div>
    </div>
  );
};

export function renderApp(rootElement: HTMLElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <DefaultStakeholderApp />
    </React.StrictMode>,
  );
}

export default DefaultStakeholderApp;
