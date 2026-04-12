import Graph from "graphology";
import type { GraphNodeAttributes, GraphEdgeAttributes } from ".";


export function createGraph(): Graph<GraphNodeAttributes, GraphEdgeAttributes> {
  return new Graph<GraphNodeAttributes, GraphEdgeAttributes>({
    multi: false,
    allowSelfLoops: false,
    type: 'directed'
  });
}
