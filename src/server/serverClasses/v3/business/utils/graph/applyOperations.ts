// import type { GraphEdgeAttributes, GraphNodeAttributes, GraphOperation, TesterantoGraph } from "../../../../../graph";

// export function applyOperations(
//   graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
//   operations: GraphOperation[]
// ): void {
//   for (const op of operations) {
//     switch (op.type) {
//       case 'addNode':
//         {
//           const id = op.data.id || `node-${Date.now()}`;
//           if (!graph.hasNode(id)) {
//             const { id: _id, ...attrs } = op.data;
//             graph.addNode(id, attrs);
//           }
//         }
//         break;
//       case 'addEdge':
//         {
//           const { source, target, attributes } = op.data;
//           if (!graph.hasEdge(source, target)) {
//             graph.addEdge(source, target, attributes);
//           }
//         }
//         break;
//       case 'updateNode':
//         {
//           const nodeId = op.data.id;
//           if (graph.hasNode(nodeId)) {
//             graph.mergeNodeAttributes(nodeId, op.data);
//           }
//         }
//         break;
//       case 'removeNode':
//         {
//           if (graph.hasNode(op.data.id)) graph.dropNode(op.data.id);
//         }
//         break;
//       case 'updateEdge':
//         {
//           const { source, target } = op.data;
//           const edgeKey = graph.edge(source, target);
//           if (edgeKey !== undefined) {
//             graph.mergeEdgeAttributes(edgeKey, op.data);
//           }
//         }
//         break;
//       case 'removeEdge':
//         {
//           const { source, target } = op.data;
//           if (graph.hasEdge(source, target)) {
//             graph.dropEdge(source, target);
//           }
//         }
//         break;
//     }
//   }
// }
