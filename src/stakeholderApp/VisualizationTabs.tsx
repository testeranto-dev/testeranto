import React, { useState } from "react";
import type { Node } from "grafeovidajo/core";
import { getFeatureGraphStats } from "./stateless/featureGraphStats";
import { renderVisualization } from "./stateless/renderVisualization";

export interface VisualizationTabsProps {
  data: any;
  onNodeClick: (node: Node) => void;
  onNodeHover: (node: Node | null) => void;
}

export const VisualizationTabs: React.FC<VisualizationTabsProps> = ({
  data,
  onNodeClick,
  onNodeHover,
}) => {
  const [activeTab, setActiveTab] = useState<
    "tree" | "file-tree" | "eisenhower" | "gantt" | "kanban"
  >("tree");

  const stats = getFeatureGraphStats(data.featureGraph);

  const tabs = [
    { id: "tree", label: "Feature Tree" },
    { id: "file-tree", label: "File Tree" },
    { id: "eisenhower", label: "Eisenhower Matrix" },
    { id: "gantt", label: "Gantt Chart" },
    { id: "kanban", label: "Kanban Board" },
  ] as const;

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ 
          display: "flex", 
          borderBottom: "2px solid #e0e0e0",
          marginBottom: "20px"
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 24px",
                backgroundColor: activeTab === tab.id ? "#007acc" : "transparent",
                color: activeTab === tab.id ? "white" : "#333",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #007acc" : "2px solid transparent",
                cursor: "pointer",
                fontWeight: activeTab === tab.id ? "bold" : "normal",
                fontSize: "14px",
                marginBottom: "-2px",
                borderRadius: "4px 4px 0 0",
                transition: "all 0.2s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ 
          border: "1px solid #ddd", 
          borderRadius: "8px", 
          padding: "20px", 
          marginBottom: "20px",
          minHeight: "400px"
        }}>
          {renderVisualization({
            data,
            vizType: activeTab,
            onNodeClick,
            onNodeHover,
          })}
        </div>
      </div>

      <div
        style={{
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <h4>Feature Graph Statistics</h4>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div>
            <strong>Total Features:</strong> {stats.totalFeatures}
          </div>
          <div>
            <strong>Dependencies:</strong> {stats.dependencies}
          </div>
          <div>
            <strong>Todo:</strong> {stats.todo}
          </div>
          <div>
            <strong>Doing:</strong> {stats.doing}
          </div>
          <div>
            <strong>Done:</strong> {stats.done}
          </div>
        </div>
      </div>
    </div>
  );
};
