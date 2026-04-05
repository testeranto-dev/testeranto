import type { GraphData } from "grafeovidajo";
import type { GraphNodeAttributes, GraphEdgeAttributes, GraphNodeType, GraphEdgeType } from ".";
import { isGraphData } from "./isGraphData";
import { isGraphDataFile } from "./isGraphDataFile";

// Helper to extract GraphData from GraphDataFile
export function extractGraphDataFromFile(fileData: any): GraphData {
  if (isGraphDataFile(fileData)) {
    return fileData.data.unifiedGraph;
  } else if (isGraphData(fileData)) {
    return fileData;
  }
  throw new Error('Invalid graph data format: expected unifiedGraph format');
}
