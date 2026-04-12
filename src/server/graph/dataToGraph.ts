import type Graph from "graphology";
import type { GraphData, GraphNodeAttributes, GraphEdgeAttributes } from ".";
import { createGraph } from "./createGraph";


// Load data into graph
export function dataToGraph(data: GraphData): Graph<GraphNodeAttributes, GraphEdgeAttributes> {
  const graph = createGraph();

  // Add nodes
  data.nodes.forEach(node => {
    graph.addNode(node.id, node);
  });

  // Add edges
  data.edges.forEach(edge => {
    graph.addEdge(edge.source, edge.target, edge.attributes);
  });

  return graph;
}
