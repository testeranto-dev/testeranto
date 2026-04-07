import type { GraphData, VizConfig } from 'grafeovidajo';
import React from 'react';

export interface VizComponentProps {
  data: GraphData;
  config: VizConfig;
  width: number;
  height: number;
  onNodeClick?: (node: any) => void;
  onNodeHover?: (node: any | null) => void;
  onNodeUpdate?: (nodeId: string, updatedAttributes: Record<string, any>) => void;
}

export const BaseChart: React.FC<VizComponentProps> = (props) => {
  const { data, width, height } = props;

  // Simple implementation for now
  return (
    <div style={{ width, height, border: '1px solid #e0e0e0', borderRadius: '4px', padding: '10px' }}>
      <h4>Base Chart (VS Code)</h4>
      <p>Nodes: {data.nodes?.length || 0}</p>
      <p>Edges: {data.edges?.length || 0}</p>
      <div style={{ fontSize: '12px', color: '#666' }}>
        This is a placeholder BaseChart for VS Code extension.
        In a real implementation, this would render the actual visualization.
      </div>
    </div>
  );
};
