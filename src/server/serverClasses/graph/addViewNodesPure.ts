import type { ITesterantoConfig } from "../../../Types";
import type { GraphOperation } from "../../../graph";

export function addViewNodesPure(
  configs: ITesterantoConfig,
  projectRoot: string,
  timestamp: string
): GraphOperation[] {
  const views = configs.views;
  if (!views) return [];

  const operations: GraphOperation[] = [];

  for (const [viewKey, viewConfig] of Object.entries(views)) {
    const viewNodeId = `view:${viewKey}`;

    operations.push({
      type: 'addNode',
      data: {
        id: viewNodeId,
        type: 'view',
        label: viewKey,
        description: `View: ${viewKey}`,
        status: 'done',
        icon: 'eye',
        metadata: {
          viewKey,
          viewPath: (viewConfig as any).filePath,
          sliceDataPath: `${projectRoot}/testeranto/slices/views/${viewKey}.json`,
          timestamp
        }
      },
      timestamp
    });
  }

  return operations;
}
