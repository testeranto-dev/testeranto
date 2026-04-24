import { Palette } from "../../../colors";
import type { GraphData } from "../../../graph";

// Pure function to create graph data file structure
export function createGraphDataFilePure(
  graphData: GraphData
): any {
  // Create the unified GraphDataFile structure directly
  const graphDataFile = {
    timestamp: new Date().toISOString(),
    version: '1.0',
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
          nodeColor: Palette.rust,
          nodeShape: 'circle'
        }
      },
      configs: {}
    }
  };

  return graphDataFile;
}
