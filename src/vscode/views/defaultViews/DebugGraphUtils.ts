import type { GraphData } from '../../../graph';
import type { DebugGraphConfig } from './DebugGraphView';

export interface SelectedElement {
  type: 'node' | 'edge';
  id: string;
  data: Record<string, any>;
}

export function convertGraphData(data: GraphData | null, config: DebugGraphConfig): { nodes: any[]; links: any[] } {
  if (!data) return { nodes: [], links: [] };
  const nodes = (data.nodes || []).map((n: any) => ({
    id: n.id,
    name: n.label || n.id,
    val: n.val || 1,
    color: n.color || config.nodeColor || '#4a90e2',
    ...n
  }));
  const links = (data.edges || []).map((e: any) => ({
    source: e.source,
    target: e.target,
    color: e.attributes?.color || config.edgeColor || '#999',
    width: e.attributes?.weight || 0.5,
    ...e
  }));
  return { nodes, links };
}

export function getDefaultConfig(): DebugGraphConfig {
  return {
    nodeColor: '#4a90e2',
    edgeColor: '#999',
    nodeSize: 5,
    edgeSize: 1,
    showLabels: true,
    labelSize: 12,
    labelColor: '#333',
    labelThreshold: 5
  };
}
