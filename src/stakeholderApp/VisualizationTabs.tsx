import React, { useState } from "react";
import type { Node } from "grafeovidajo/core";
import { getFeatureGraphStats } from "./stateless/featureGraphStats";
import { renderVisualization } from "./stateless/renderVisualization";
// Import DebugGraph
import { DebugGraph } from "../grafeovidajo/charts/DebugGraph";
import { Palette } from "../colors";

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
    "tree" | "file-tree" | "eisenhower" | "gantt" | "kanban" | "debug"
  >("tree");

  const stats = getFeatureGraphStats(data.featureGraph);

  const tabs = [
    { id: "tree", label: "Feature Tree" },
    { id: "file-tree", label: "File Tree" },
    { id: "eisenhower", label: "Eisenhower Matrix" },
    { id: "gantt", label: "Gantt Chart" },
    { id: "kanban", label: "Kanban Board" },
    { id: "debug", label: "Debug View" },
  ] as const;

  // Handle debug view separately since it uses unifiedGraph
  const renderDebugView = () => {
    if (!data.unifiedGraph) {
      return (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h3>No Unified Graph Data Available</h3>
          <p>The unified graph data is not available in the current data structure.</p>
        </div>
      );
    }

    const debugConfig = {
      projection: {
        xAttribute: 'id',
        yAttribute: 'type',
        xType: 'categorical' as const,
        yType: 'categorical' as const,
        layout: 'force' as const, // Use force-directed layout
        spacing: { x: 120, y: 100 },
        // Force layout parameters
        repulsionStrength: -300,
        attractionStrength: 0.1,
        damping: 0.85,
        iterations: 150
      },
      style: {
        nodeSize: 15,
        nodeColor: (node: any) => {
          const type = node.type || 'unknown';
          const metadata = node.attributes?.metadata || {};

          // For test_result nodes, color based on result
          if (type === 'test_result') {
            const result = metadata.result;

            // Determine color based on result
            if (result === 0 || result === false) {
              return Palette.bluishGreen; // Success
            } else if (result > 0) {
              return Palette.amberGold; // Warning
            } else if (result < 0 || result === true) {
              return Palette.deepOrange; // Error
            }
            // Default for test_result
            return Palette.deepOrange;
          }

          // For test nodes, check if they have a failed status
          if (type === 'test') {
            const failed = metadata.failed;

            if (failed === false) {
              return Palette.bluishGreen; // Success
            } else if (failed === true) {
              return Palette.deepOrange; // Error
            }
          }

          // Special handling for folders
          if (type === 'folder') {
            if (metadata.isVirtual) {
              return Palette.amberGold; // Orange for virtual URL folders
            } else {
              return Palette.oliveDark; // Dark Green for regular folders
            }
          }

          const typeColors: Record<string, string> = {
            'feature': Palette.bluishGreen,
            'entrypoint': Palette.rust,
            'test': Palette.amberGold,
            'test_result': Palette.deepOrange,
            'file': Palette.warmGrey,
            'documentation': Palette.oliveDark,
            'config': Palette.charcoal,
            'attribute': Palette.amberGold,
            'folder': Palette.oliveDark,
            'domain': Palette.rust,
            'unknown': Palette.charcoal
          };
          return typeColors[type] || typeColors.unknown;
        },
        nodeShape: 'circle' as const,
        labels: {
          show: true,
          attribute: 'label',
          fontSize: 12
        },
        edgeColor: '#999',
        edgeWidth: 2
      },
      showNodeIds: true,
      showAttributes: true,
      forceLayout: {
        strength: -300, // Repulsive force
        distance: 100,  // Ideal distance between nodes
        iterations: 150 // Number of iterations to run
      }
    };

    return (
      <DebugGraph
        data={data.unifiedGraph}
        config={debugConfig}
        width={800}
        height={600}
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}
      />
    );
  };

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
          {activeTab === "debug" ? (
            renderDebugView()
          ) : (
            renderVisualization({
              data,
              vizType: activeTab,
              onNodeClick,
              onNodeHover,
            })
          )}
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
