import React, { useRef, useEffect, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import type { GraphData } from '../../../graph';

export interface DebugGraphV2Props {
  data?: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: any) => void;
  onNodeHover?: (node: any | null) => void;
  onEdgeClick?: (edge: any) => void;
  onEdgeHover?: (edge: any | null) => void;
}

export const DebugGraphV2: React.FC<DebugGraphV2Props> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  onNodeHover,
  onEdgeClick,
  onEdgeHover,
}) => {
  // Convert GraphData to the format expected by ForceGraph3D
  const graphData = useMemo(() => {
    if (!data) {
      return { nodes: [], links: [] };
    }

    const nodes = (data.nodes || []).map((n: any) => ({
      id: n.id,
      name: n.label || n.id,
      val: n.val || 1,
      color: n.color || '#4a90e2',
      ...n
    }));

    const links = (data.edges || []).map((e: any) => ({
      source: e.source,
      target: e.target,
      color: e.attributes?.color || '#999',
      width: e.attributes?.weight || 0.5,
      ...e
    }));

    return { nodes, links };
  }, [data]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ForceGraph3D
        graphData={graphData}
        // Customizing the appearance
        nodeLabel="name"
        nodeAutoColorBy="group"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
      />
    </div>
  );
};

export default DebugGraphV2;
