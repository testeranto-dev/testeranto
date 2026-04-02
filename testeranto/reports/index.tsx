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


// Determine if we're in development mode (server API available)
// In development, we can use /api/graph-data for live updates
// In static mode, we load from graph-data.json file
const isDevelopmentMode = window.location.hostname.includes('localhost') &&
  window.location.protocol.startsWith('http');

// Paths for loading graph data
const GRAPH_DATA_PATHS = {
  // In development, use API endpoint
  development: '/api/graph-data',
  // In static mode, load from file in same directory
  static: 'graph-data.json'
} as const;

// Types from api.ts - for type safety
// These match the actual types defined in src/api.ts
// See: src/api.ts -> export interface GraphDataResponse
interface GraphDataResponse {
  success: boolean;
  timestamp: string;
  data: any;
}

// GraphData type - should match the definition in grafeovidajo
interface GraphData {
  nodes: Node[];
  edges?: Edge[];
}

interface Node {
  id: string;
  attributes: Record<string, any>;
}

interface Edge {
  source: string;
  target: string;
  attributes?: Record<string, any>;
}

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
    // documentationGlob?: string;
  };
  timestamp: string;
  workspaceRoot: string;
  featureTree?: any;
  allTestResults?: {
    [configKey: string]: {
      [testName: string]: any;
    };
  };
  featureGraph?: GraphData;
  fileTreeGraph?: GraphData;
  vizConfig?: any;
}


export const DefaultStakeholderApp: React.FC = () => {
  const [data, setData] = React.useState<StakeholderData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [graphClient, setGraphClient] = React.useState<StakeholderGraphClient | null>(null);

  React.useEffect(() => {
    // Initialize graph client when data is loaded
    if (data && !graphClient) {
      const client = new StakeholderGraphClient((updatedGraphData) => {
        // Update data with new graph
        setData(prev => prev ? {
          ...prev,
          featureGraph: updatedGraphData.featureGraph || prev.featureGraph,
          fileTreeGraph: updatedGraphData.fileTreeGraph || prev.fileTreeGraph
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

      // Determine if we're in API mode or static mode
      // In API mode, the server is running and we can fetch from /~/graph
      // In static mode, we load from graph-data.json in the same directory

      // First, try to detect if we're in API mode by checking if we can access the server
      // We'll try to fetch from /~/graph with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      let isApiMode = false;

      try {
        const response = await fetch('/~/graph', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          isApiMode = true;
          const result = await response.json();
          if (result.graphData) {
            // Convert to StakeholderData format
            const stakeholderData: StakeholderData = {
              configs: result.graphData.configs || {},
              allTestResults: result.graphData.allTestResults || {},
              featureTree: result.graphData.featureTree || {},
              featureGraph: result.graphData.featureGraph || { nodes: [], edges: [] },
              fileTreeGraph: result.graphData.fileTreeGraph || { nodes: [], edges: [] },
              vizConfig: result.graphData.vizConfig || {
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
              timestamp: new Date().toISOString(),
              workspaceRoot: ''
            };
            setData(stakeholderData);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        // Server is not available or request failed
        console.log('API mode not available, falling back to static mode:', error);
      }

      clearTimeout(timeoutId);

      // If we're not in API mode, try static mode
      try {
        const response = await fetch('graph-data.json');
        if (!response.ok) {
          throw new Error(`Failed to load static file: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        setData(result as StakeholderData);
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

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Testeranto Stakeholder Report</h1>
      <div style={{ marginBottom: "20px" }}>
        <VisualizationTabs
          data={data}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
        />
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
