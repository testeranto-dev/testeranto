// NOTE: this file is not a part of our build process, but a downstream process run by the user
// this file is copied to the users project where they can customize it
// This is where a user configures the visualization.

import React, { useState } from "react";
import ReactDOM from "react-dom/client";

// IMPORTANT : all imports need tog through testeranto/stakeholderApp
import {
  VisualizationTabs,
} from "testeranto/stakeholderApp/VisualizationTabs.tsx";

// Determine if we're in static mode (no server API available)
// In static mode, we can't use /api/graph-data, only the JSON file
const isStaticMode = window.location.protocol === 'file:' || 
                     !window.location.hostname.includes('localhost');

// API paths - must match those defined in src/api.ts
// See: src/api.ts -> export const stakeholderHttpAPI
const API_PATHS = {
  // From stakeholderHttpAPI.getGraphData in api.ts
  GRAPH_DATA_API: '/api/graph-data',
  // From stakeholderHttpAPI.getGraphDataJson in api.ts
  GRAPH_DATA_JSON: '/graph-data.json',
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
    documentationGlob?: string;
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

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      // 1. Try Server API (as defined in api.ts stakeholderHttpAPI.getGraphData)
      // Skip in static mode since API won't be available
      if (!isStaticMode) {
        try {
          const response = await fetch(API_PATHS.GRAPH_DATA_API);
          if (!response.ok) throw new Error(`API ${response.status}`);

          const result: GraphDataResponse = await response.json();
          if (result.success) {
            // Cast to StakeholderData since we know the structure
            setData(result.data as StakeholderData);
          } else {
            // Handle API error response
            throw new Error(`API returned error at ${result.timestamp}`);
          }
          setLoading(false);
          return;
        } catch (apiError) {
          console.warn("API failed, trying JSON file...", apiError.message);
        }
      }

      // 2. Try Static JSON (as defined in api.ts stakeholderHttpAPI.getGraphDataJson)
      try {
        const response = await fetch(API_PATHS.GRAPH_DATA_JSON);
        if (!response.ok) throw new Error(`JSON file ${response.status}`);

        // In static mode, the JSON file contains the raw data directly
        const jsonData = await response.json();
        setData(jsonData);
        setLoading(false);
        return;
      } catch (jsonError) {
        console.warn("JSON file failed:", jsonError.message);
      }

      // 3. Final Fail-safe (If everything above failed)
      setError("All data sources failed.");
      setLoading(false);
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
