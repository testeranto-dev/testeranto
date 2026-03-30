// NOTE: this file is not a part of our build process, but a downstream process run by the user
// this file is copied to the users project where they can customize it
// This is where a user configures the visualization.

import React, { useState } from "react";
import ReactDOM from "react-dom/client";

// IMPORTANT : all imports need tog through stakeholderExports
import {
  VisualizationTabs,
} from "../../src/stakeholderExports";


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

      // 1. Try Server API
      // try {
      //   const response = await fetch('/api/graph-data');
      //   if (!response.ok) throw new Error(`API ${response.status}`);

      //   const result = await response.json();
      //   setData(result.data || result);
      //   setLoading(false);
      //   return;
      // } catch (apiError) {
      //   console.warn("API failed, trying JSON file...", apiError.message);
      // }

      // 2. Try Static JSON
      try {
        const response = await fetch('/testeranto/reports/graph-data.json');
        if (!response.ok) throw new Error(`JSON file ${response.status}`);

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
  };

  const handleNodeHover = (node: Node | null) => {
    // Handle hover
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
