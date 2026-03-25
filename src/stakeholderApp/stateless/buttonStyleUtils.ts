/**
 * Utility functions for button styling
 */

export function getTabButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "10px 20px",
    backgroundColor: active ? "#007acc" : "#f0f0f0",
    color: active ? "white" : "black",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  };
}

export function getVizButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 16px",
    backgroundColor: active ? "#4caf50" : "#f0f0f0",
    color: active ? "white" : "black",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  };
}
