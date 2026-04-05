import Graph from "graphology";
import type { GraphNodeAttributes, GraphEdgeAttributes } from ".";

// Create a new graph instance with our schema
export function createGraph(): Graph<GraphNodeAttributes, GraphEdgeAttributes> {
  return new Graph<GraphNodeAttributes, GraphEdgeAttributes>({
    multi: false,
    allowSelfLoops: false,
    type: 'directed'
  });
}
