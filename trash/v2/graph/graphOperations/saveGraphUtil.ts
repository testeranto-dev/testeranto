import path from 'path';
import fs from 'fs';
import type { GraphData } from '../../../../graph';

export function saveGraphUtil(
  graphDataPath: string,
  getGraphData: () => GraphData,
  emitGraphSaved: () => void,
  configs?: any,
  vizConfig?: any
): void {
  try {
    const graphData = getGraphData();
    const timestamp = new Date().toISOString();
    const version = '1.0';

    const graphDataFile = {
      timestamp,
      version,
      data: {
        unifiedGraph: graphData,
        vizConfig: vizConfig || {
          projection: {
            xAttribute: 'status',
            yAttribute: 'priority',
            xType: 'categorical' as const,
            yType: 'continuous' as const,
            layout: 'grid' as const
          },
          style: {
            nodeSize: 10,
            nodeColor: '#882255',
            nodeShape: 'circle' as const
          }
        },
        configs: configs || {}
      }
    };

    const dir = path.dirname(graphDataPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (mkdirError) {
        console.error(`[saveGraphUtil] Failed to create directory ${dir}:`, mkdirError);
        return;
      }
    }

    const jsonContent = JSON.stringify(graphDataFile, null, 2);

    try {
      fs.writeFileSync(graphDataPath, jsonContent, 'utf-8');
      console.log(`[saveGraphUtil] Successfully wrote to ${graphDataPath}`);
    } catch (writeError) {
      console.error(`[saveGraphUtil] Failed to write to ${graphDataPath}:`, writeError);
    }

    emitGraphSaved();
  } catch (error) {
    console.error('[saveGraphUtil] Error saving graph:', error);
  }
}
