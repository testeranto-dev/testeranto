import type { GraphUpdate } from "../../../graph";

export async function updateTestStatusInGraphPure(
  testName: string,
  status: 'todo' | 'doing' | 'done' | 'blocked'
): Promise<GraphUpdate> {
  const entrypointId = `entrypoint:${testName}`;
  const timestamp = new Date().toISOString();
  
  return {
    operations: [{
      type: 'updateNode',
      data: {
        id: entrypointId,
        status: status,
        metadata: {
          lastUpdated: timestamp
        }
      },
      timestamp
    }],
    timestamp
  };
}
