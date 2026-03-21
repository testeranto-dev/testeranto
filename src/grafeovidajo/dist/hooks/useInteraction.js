// hooks/useInteraction.ts
import { useState, useCallback } from "react";
function useInteraction() {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node);
  }, []);
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);
  return {
    hoveredNode,
    selectedNode,
    handleNodeHover,
    handleNodeClick
  };
}
export {
  useInteraction
};
