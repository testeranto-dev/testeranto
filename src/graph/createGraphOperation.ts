import type { GraphData } from "grafeovidajo";
import type { GraphOperation, GraphUpdate, GraphDataFile, GraphNodeAttributes, GraphEdgeAttributes, GraphNodeType, GraphEdgeType } from ".";
import { Palette } from "../colors";

// Helper to create a graph operation
export function createGraphOperation(
  type: GraphOperation['type'],
  data: any,
  timestamp?: string
): GraphOperation {
  return {
    type,
    data,
    timestamp: timestamp || new Date().toISOString()
  };
}
