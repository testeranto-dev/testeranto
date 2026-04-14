import type { GraphOperation } from "../../../graph";

export function connectAllTestsToEntrypointPure(
  entrypointId: string,
  testNodeIds: string[],
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];

  if (!entrypointId) {
    return operations;
  }

  for (const testNodeId of testNodeIds) {
    operations.push({
      type: 'addEdge',
      data: {
        source: entrypointId,
        target: testNodeId,
        attributes: {
          type: 'belongsTo',
          // 
        }
      },
      timestamp
    });
  }

  return operations;
}
