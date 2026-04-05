import type { GraphData, GraphDataFile, GraphEdgeAttributes, GraphEdgeType, GraphNodeAttributes, GraphNodeType, GraphOperation, GraphUpdate } from ".";
import { Palette } from "../colors";

// Helper to create node attributes
export function createNodeAttributes(
  id: string,
  type: GraphNodeType,
  label: string,
  options?: Partial<Omit<GraphNodeAttributes, 'id' | 'type' | 'label'>>
): GraphNodeAttributes {
  // Clean up metadata to remove size and isJson if present
  const metadata = options?.metadata;
  if (metadata) {
    const {
      // size, 
      // isJson,
      // Also remove other unwanted fields
      configKey,
      testName,
      filePath,
      relativePath,
      result,
      content,
      // modified,
      ...cleanMetadata
    } = metadata;
    return {
      id,
      type,
      label,
      description: options?.description,
      status: options?.status,
      priority: options?.priority,
      timestamp: options?.timestamp || new Date().toISOString(),
      metadata: cleanMetadata
    };
  }

  return {
    id,
    type,
    label,
    description: options?.description,
    status: options?.status,
    priority: options?.priority,
    timestamp: options?.timestamp || new Date().toISOString(),
    metadata: options?.metadata
  };
}
