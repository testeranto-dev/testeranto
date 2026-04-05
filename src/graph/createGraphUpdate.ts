import type { GraphData } from "grafeovidajo";
import type { GraphOperation, GraphUpdate, GraphDataFile, GraphNodeAttributes, GraphEdgeAttributes, GraphNodeType, GraphEdgeType } from ".";
import { Palette } from "../colors";

// Helper to create a graph update
export function createGraphUpdate(
  operations: GraphOperation[],
  timestamp?: string
): GraphUpdate {
  return {
    operations,
    timestamp: timestamp || new Date().toISOString()
  };
}
