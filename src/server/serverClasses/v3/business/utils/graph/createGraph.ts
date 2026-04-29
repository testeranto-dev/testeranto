import Graph from "graphology";
import type {
  GraphEdgeAttributes,
  GraphNodeAttributes,
  TesterantoGraph
} from "../../../../../graph";

export function createGraph(): TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes> {
  return new Graph<GraphNodeAttributes, GraphEdgeAttributes>({
    multi: false,
    allowSelfLoops: false,
    type: 'directed'
  });
}
