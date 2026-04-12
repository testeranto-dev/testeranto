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

export function writeSliceFile(
  projectRoot: string,
  viewKey: string,
  sliceData: any
): void {
  const viewsSlicesDir = path.join(projectRoot, 'testeranto', 'slices', 'views');
  if (!fs.existsSync(viewsSlicesDir)) {
    fs.mkdirSync(viewsSlicesDir, { recursive: true });
  }

  const sliceFilePath = path.join(viewsSlicesDir, `${viewKey}.json`);
  const content = JSON.stringify(sliceData, null, 2);

  fs.writeFileSync(sliceFilePath, content, 'utf8');
}

export function writeAgentSliceFile(
  projectRoot: string,
  agentName: string,
  sliceData: any
): void {
  try {
    const agentsSlicesDir = path.join(projectRoot, 'testeranto', 'slices', 'agents');
    if (!fs.existsSync(agentsSlicesDir)) {
      fs.mkdirSync(agentsSlicesDir, { recursive: true });
    }

    const sliceFilePath = path.join(agentsSlicesDir, `${agentName}.json`);
    const content = JSON.stringify(sliceData, null, 2);

    fs.writeFileSync(sliceFilePath, content, 'utf8');
  } catch (error: any) {
    console.error(`Error writing agent slice file for ${agentName}:`, error);
  }
}

export function getSliceFilePath(projectRoot: string, viewKey: string): string {
  return path.join(projectRoot, 'testeranto', 'slices', 'views', `${viewKey}.json`);
}

export function getAgentSliceFilePath(projectRoot: string, agentName: string): string {
  return path.join(projectRoot, 'testeranto', 'slices', 'agents', `${agentName}.json`);
}
