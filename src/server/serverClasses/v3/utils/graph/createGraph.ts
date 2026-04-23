import Graph from "graphology";
import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../../graph";
// import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from "../../../graph";

export function createGraph(): TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes> {
  return new Graph<GraphNodeAttributes, GraphEdgeAttributes>({
    multi: false,
    allowSelfLoops: false,
    type: 'directed'
  });
}
