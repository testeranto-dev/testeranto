import { useState, useCallback } from 'react';
import { Node } from '../core/types';

export function useInteraction() {
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const handleNodeHover = useCallback((node: Node | null) => {
    setHoveredNode(node);
  }, []);

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  return {
    hoveredNode,
    selectedNode,
    handleNodeHover,
    handleNodeClick,
  };
}
