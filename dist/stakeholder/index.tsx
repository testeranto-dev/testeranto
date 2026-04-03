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

// Import types from the graph module
import type { GraphData } from '../../graph/index';

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
  // featureTree is now encoded in featureGraph via parentOf edges
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

      // Always load baseline from graph-data.json first
      // This ensures consistent baseline across all modes
      try {
        const response = await fetch('/testeranto/reports/graph-data.json');
        if (!response.ok) {
          throw new Error(`Failed to load static file: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        
        // Handle both direct StakeholderData format and nested data format
        let stakeholderData: StakeholderData;
        if (result.data) {
          // New format with nested data
          stakeholderData = {
            configs: result.data.configs || {},
            allTestResults: result.data.allTestResults || {},
            // featureTree is no longer included - tree structure is encoded in featureGraph via parentOf edges
            featureGraph: result.data.featureGraph || { nodes: [], edges: [] },
            fileTreeGraph: result.data.fileTreeGraph || { nodes: [], edges: [] },
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
        } else {
          // Direct StakeholderData format
          stakeholderData = result as StakeholderData;
        }
        
        setData(stakeholderData);
        setLoading(false);
        
        // After loading baseline, we can connect to WebSocket for live updates
        // The WebSocket connection is handled by the graph client initialization
        // which happens in the other useEffect when data is set
        
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
