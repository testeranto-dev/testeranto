import fs from 'fs';
import path from 'path';
import type { GraphData } from "../../../graph";
import { saveGraphPure } from "./saveGraphPure";

export function saveGraphUtil(
  graphData: GraphData,
  graphDataPath: string,
  configs?: any,
  resourceChanged?: (path: string) => void
): void {
  const result = saveGraphPure(graphData, graphDataPath, configs);
  
  if (!result.success) {
    throw new Error(`Failed to save graph: ${result.error}`);
  }
  
  const timestamp = new Date().toISOString();
  const version = '1.0';
  const graphDataFile = {
    timestamp,
    version,
    data: {
      unifiedGraph: graphData,
      vizConfig: {
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
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(graphDataPath, JSON.stringify(graphDataFile, null, 2), 'utf-8');
  
  if (resourceChanged) {
    resourceChanged('/~/graph');
  }
}
