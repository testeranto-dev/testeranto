import type { GraphUpdate, GraphData } from '../../../../graph';
import { createAiderNodeGraphOperationsPure } from '../../Server_Docker/utils/launchAiderPure';

export async function updateGraphWithAiderNodeUtil(
  params: {
    runtime: string;
    testName: string;
    configKey: string;
    aiderServiceName: string;
    containerId?: string;
  },
  applyUpdate: (update: GraphUpdate) => GraphData
): Promise<void> {
  const timestamp = new Date().toISOString();
  const operations = createAiderNodeGraphOperationsPure({
    ...params,
    timestamp
  });
  const update: GraphUpdate = {
    operations,
    timestamp
  };
  applyUpdate(update);
}
