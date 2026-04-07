import fs from 'fs';
import path from 'path';
import { Palette } from "../../../colors";

export function saveGraphDataForStaticModePure(
  projectRoot: string,
  fullGraphData: any
): void {
  try {
    const filePath = path.join(projectRoot, 'testeranto', 'reports', 'graph-data.json');
    const dir = path.dirname(filePath);

    const staticGraphData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        unifiedGraph: fullGraphData.unifiedGraph || { nodes: [], edges: [] },
        vizConfig: fullGraphData.vizConfig || {
          projection: {
            xAttribute: 'status',
            yAttribute: 'priority',
            xType: 'categorical' as const,
            yType: 'continuous' as const,
            layout: 'grid' as const
          },
          style: {
            nodeSize: 10,
            nodeColor: Palette.rust,
            nodeShape: 'circle' as const
          }
        },
        configs: fullGraphData.configs || {}
      }
    };

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(staticGraphData, null, 2), 'utf-8');

    try {
      const writtenContent = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(writtenContent);
    } catch (verifyError) {
      console.error(`[graphFileUtils] Failed to verify written file:`, verifyError);
    }
  } catch (error) {
    console.error('[graphFileUtils] Error saving static graph data:', error);
  }
}
