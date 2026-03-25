import React from "react";

export interface TabNavigationProps {
  activeTab: "tree" | "viz";
  onTabChange: (tab: "tree" | "viz") => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const getTabButtonStyle = (isActive: boolean) => ({
    padding: "10px 20px",
    border: "none",
    background: isActive ? "#007acc" : "#f0f0f0",
    color: isActive ? "white" : "#333",
    cursor: "pointer",
    borderRadius: "4px",
    fontWeight: "bold" as const,
    fontSize: "14px",
  });

  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
      <button
        style={getTabButtonStyle(activeTab === "tree")}
        onClick={() => onTabChange("tree")}
      >
        File Tree
      </button>
      <button
        style={getTabButtonStyle(activeTab === "viz")}
        onClick={() => onTabChange("viz")}
      >
        Visualizations
      </button>
    </div>
  );
};
