// NOTE: this file is not a part of our build process, but a odwnstream process run by the user
// this file is copied to the users project where they can cutomize it
// This is where a used configure the vizualization.
//  for instance, the columns in a kanban chart and to which attribute they map

import React, { useState } from "react";
import type { Node } from "typescript";
import type { window } from "vscode";
import type { GraphData } from "../../grafeovidajo";
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
  // Add viz configuration
  vizConfig?: any;
}

export interface StakeholderAppProps {
  data: StakeholderData;
}

export const DefaultStakeholderApp: React.FC<StakeholderAppProps> = ({
  data,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set([".", "root"]),
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"tree" | "viz">("tree");
  const [vizType, setVizType] = useState<
    "eisenhower" | "gantt" | "kanban" | "tree"
  >("eisenhower");

  const toggleExpand = (path: string) => {
    setExpandedPaths(togglePathInSet(expandedPaths, path));
  };

  const handleFileSelect = (node: any) => {
    setSelectedFile(node.path);
    const embeddedData = (window as any).TESTERANTO_EMBEDDED_DATA;
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
export function renderApp(rootElement: HTMLElement, data?: StakeholderData) {
  // If no data is provided, try to get it from window
  const appData =
    data ||
    (typeof window !== "undefined" && (window as any).TESTERANTO_EMBEDDED_DATA);

  if (!appData) {
    console.error("No stakeholder data available");
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <DefaultStakeholderApp data={appData} />
    </React.StrictMode>,
  );
}

// Export for use in HTML
export default DefaultStakeholderApp;
