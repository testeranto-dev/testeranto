import React from "react";
import { getFeatureGraphStats } from "./stateless/featureGraphStats";
import { renderVisualization } from "./stateless/renderVisualization";
import type { Node } from "../grafeovidajo";

export interface VisualizationPanelProps {
  data: any;
  vizType: "eisenhower" | "gantt" | "kanban" | "tree";
  onVizTypeChange: (type: "eisenhower" | "gantt" | "kanban" | "tree") => void;
  onNodeClick: (node: Node) => void;
  onNodeHover: (node: Node | null) => void;
}

export const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  data,
  vizType,
  onVizTypeChange,
  onNodeClick,
  onNodeHover,
}) => {
  const stats = getFeatureGraphStats(data.unifiedGraph);

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h3>Select Visualization Type</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {["tree", "eisenhower", "gantt", "kanban"].map((type) => (
            <button
              key={type}
              onClick={() => onVizTypeChange(type as any)}
              style={{
                padding: "10px 20px",
                backgroundColor: vizType === type ? "#007acc" : "#f0f0f0",
                color: vizType === type ? "white" : "black",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: vizType === type ? "bold" : "normal",
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
        {renderVisualization({
          data,
          vizType,
          onNodeClick,
          onNodeHover,
        })}
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
