import type { GraphEdgeType, GraphEdgeAttributes } from ".";

export function createEdgeAttributes(
  type: GraphEdgeType,
  options?: Partial<Omit<GraphEdgeAttributes, 'type'>>
): GraphEdgeAttributes {
  return {
    type,
    // weight: options?.weight,
    timestamp: options?.timestamp || new Date().toISOString(),
    metadata: options?.metadata
  };
}
