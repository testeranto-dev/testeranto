import React from "react";
import type { Node } from "typescript";
import { getFeatureGraphStats } from "./stateless/featureGraphStats";
import { renderVisualization } from "./stateless/renderVisualization";
import { getVizButtonStyle } from "./stateless/buttonStyleUtils";

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
  const stats = getFeatureGraphStats(data.featureGraph);

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          style={getVizButtonStyle(vizType === "eisenhower")}
          onClick={() => onVizTypeChange("eisenhower")}
        >
          Eisenhower Matrix
        </button>
        <button
          style={getVizButtonStyle(vizType === "gantt")}
          onClick={() => onVizTypeChange("gantt")}
        >
          Gantt Chart
        </button>
        <button
          style={getVizButtonStyle(vizType === "kanban")}
          onClick={() => onVizTypeChange("kanban")}
        >
          Kanban Board
        </button>
        <button
          style={getVizButtonStyle(vizType === "tree")}
          onClick={() => onVizTypeChange("tree")}
        >
          Dependency Tree
        </button>
      </div>

      {renderVisualization({
        data,
        vizType,
        onNodeClick,
        onNodeHover,
      })}

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <h4>Feature Graph Statistics</h4>
        <p>Total Features: {stats.totalFeatures}</p>
        <p>Dependencies: {stats.dependencies}</p>
        <p>Features with status:</p>
        <ul>
          <li>Todo: {stats.todo}</li>
          <li>Doing: {stats.doing}</li>
          <li>Done: {stats.done}</li>
        </ul>
      </div>
    </div>
  );
};
