// /**
//  * Find a node in a tree by its path
//  */
// export function findNodeInTree(tree: any, path: string): any | null {
//   const parts = path.split("/").filter((part) => part.length > 0);

//   // Start from the root
//   let currentNode = tree;

//   for (const part of parts) {
//     // Check if current node has children
//     if (!currentNode.children) {
//       return null;
//     }

//     // Look for the part in children
//     if (currentNode.children[part]) {
//       currentNode = currentNode.children[part];
//     } else {
//       // Try to find a case-insensitive match or partial match
//       const foundKey = Object.keys(currentNode.children).find(
//         (key) =>
//           key.toLowerCase() === part.toLowerCase() ||
//           key.includes(part) ||
//           part.includes(key),
//       );

//       if (foundKey) {
//         currentNode = currentNode.children[foundKey];
//       } else {
//         return null;
//       }
//     }
//   }

//   return currentNode;
// }
