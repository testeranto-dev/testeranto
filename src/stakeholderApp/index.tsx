// NOTE: this file is not a part of our build process, but a odwnstream process run by the user
// this file is copied to the users project where they can cutomize it
// This is where a used configure the vizualization.
//  for instance, the columns in a kanban chart and to which attribute they map

import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import type { GraphData, Node } from "../../grafeovidajo";
import { createFileContentFromNode } from "./stateless/createFileContentFromNode";
import { togglePathInSet } from "./stateless/setUtils";
import { TabNavigation } from "./TabNavigation";
import { TestResultsSummary } from "./TestResultsSummary";
import { TreePanel } from "./TreePanel";
import { VisualizationPanel } from "./VisualizationPanel";

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
  // Add test results data
  allTestResults?: {
    [configKey: string]: {
      [testName: string]: any; // The content of tests.json
    };
  };
  // Add feature graph for visualization
  featureGraph?: GraphData;
  // Add file tree graph for visualization
  fileTreeGraph?: GraphData;
  // Add viz configuration
  vizConfig?: any;
}

export interface StakeholderAppProps {
  // Data is no longer passed as props - always use embedded data from window.TESTERANTO_EMBEDDED_DATA
  data?: StakeholderData;
}

export const DefaultStakeholderApp: React.FC = () => {
  // Always use embedded data from window
  const embeddedData = (window as any).TESTERANTO_EMBEDDED_DATA;
  
  if (!embeddedData) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1 style={{ color: "#d32f2f" }}>Error Loading Report</h1>
        <p>No embedded data found. The server may not have generated the report properly.</p>
        <p>Please make sure the Testeranto server has generated the report files.</p>
      </div>
    );
  }

  const data: StakeholderData = embeddedData;
  
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set([".", "root"]),
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"tree" | "viz">("tree");
  const [vizType, setVizType] = useState<
    "eisenhower" | "gantt" | "kanban" | "tree" | "file-tree"
  >("file-tree");

  const toggleExpand = (path: string) => {
    setExpandedPaths(togglePathInSet(expandedPaths, path));
  };

  const handleFileSelect = (node: any) => {
    setSelectedFile(node.path);
    const content = createFileContentFromNode(node, embeddedData);
    setSelectedFileContent(content);
  };

  const handleTestResultClick = (
    configKey: string,
    testName: string,
    testData: any,
  ) => {
    setSelectedFile(`${configKey}/${testName}`);
    setSelectedFileContent(testData);
  };

  const handleNodeClick = (node: Node) => {
    console.log("Node clicked:", node);
    // You could implement node selection here
  };

  const handleNodeHover = (node: Node | null) => {
    // Handle hover
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "viz" && (
          <VisualizationPanel
            data={data}
            vizType={vizType}
            onVizTypeChange={setVizType}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
          />
        )}

        {activeTab === "tree" && (
          <>
            <TreePanel
              featureTree={data.featureTree}
              expandedPaths={expandedPaths}
              selectedFile={selectedFile}
              onToggleExpand={toggleExpand}
              onFileSelect={handleFileSelect}
              selectedFileContent={selectedFileContent}
              configs={data.configs}
              allTestResults={data.allTestResults}
              onTestResultClick={handleTestResultClick}
            />
            {!selectedFile && data.allTestResults && (
              <TestResultsSummary
                allTestResults={data.allTestResults}
                onTestResultClick={handleTestResultClick}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Function to render the app
export function renderApp(rootElement: HTMLElement) {
  // Always use embedded data from window
  const embeddedData = (window as any).TESTERANTO_EMBEDDED_DATA;

  if (!embeddedData) {
    console.error("No stakeholder data available");
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h1 style="color: #d32f2f;">Error Loading Report</h1>
        <p>No embedded data found. The server may not have generated the report properly.</p>
        <p>Please make sure the Testeranto server has generated the report files.</p>
      </div>
    `;
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <DefaultStakeholderApp />
    </React.StrictMode>,
  );
}

// Export for use in HTML
export default DefaultStakeholderApp;
