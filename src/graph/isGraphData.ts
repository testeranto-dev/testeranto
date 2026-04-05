import type { GraphData } from "grafeovidajo";
import type { GraphDataFile, GraphNodeAttributes, GraphEdgeAttributes, GraphNodeType, GraphEdgeType } from ".";
import { Palette } from "../colors";

// Type guard to check if an object is GraphData
export function isGraphData(obj: any): obj is GraphData {
  return (
    obj &&
    Array.isArray(obj.nodes) &&
    obj.nodes.every((node: any) =>
      node &&
      typeof node.id === 'string' &&
      typeof node.type === 'string' &&
      typeof node.label === 'string'
    ) &&
    Array.isArray(obj.edges) &&
    obj.edges.every((edge: any) =>
      edge &&
      typeof edge.source === 'string' &&
      typeof edge.target === 'string' &&
      edge.attributes &&
      typeof edge.attributes.type === 'string'
    )
  );
}

