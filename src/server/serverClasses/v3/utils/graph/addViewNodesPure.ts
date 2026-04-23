import type { GraphOperation } from "../../../../../graph";
import type { ITesterantoConfig } from "../../../../../Types";

export function addViewNodesPure(
  configs: ITesterantoConfig,
  projectRoot: string,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];
  if (!configs.views) return operations;

  for (const [viewKey, viewConfig] of Object.entries(configs.views)) {
    operations.push({
      type: 'addNode',
      data: {
        id: `view:${viewKey}`,
        type: { category: 'view', type: 'view' },
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
