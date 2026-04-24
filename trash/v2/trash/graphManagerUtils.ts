// import type { Server_Graph } from "../Server_Graph";
// import type { ITesterantoConfig } from "../../../Types";

// export function generateFeatureTreeUtil(graphData: any): any {
//   const featureNodes = graphData.nodes.filter((node: any) => node.type === 'feature');
//   const featureEdges = graphData.edges.filter((edge: any) =>
//     edge.attributes.type === 'dependsUpon' || edge.attributes.type === 'blocks'
//   );

//   const tree: any = {};

//   featureNodes.forEach((node: any) => {
//     tree[node.id] = {
//       ...node,
//       children: [],
//       parents: []
//     };
//   });

//   featureEdges.forEach((edge: any) => {
//     if (edge.attributes.type === 'dependsUpon') {
//       if (tree[edge.source]) {
//         tree[edge.source].parents.push(edge.target);
//       }
//       if (tree[edge.target]) {
//         tree[edge.target].children.push(edge.source);
//       }
//     } else if (edge.attributes.type === 'blocks') {
//       if (tree[edge.source]) {
//         tree[edge.source].children.push(edge.target);
//       }
//       if (tree[edge.target]) {
//         tree[edge.target].parents.push(edge.source);
//       }
//     }
//   });

//   return tree;
// }

// /**
//  * This function has been moved to Server_Graph.addAgentNodesFromConfig()
//  * to follow the principle that Server_Graph should call utility functions,
//  * not the other way around.
//  */
