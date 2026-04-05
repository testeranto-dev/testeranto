import { type GraphData } from '../../graph/index';
import { Palette } from '../../colors';
import { createGraphDataFile } from "../../graph/createGraphDataFile";

// Pure function to create graph data file structure
export function createGraphDataFilePure(
  graphData: GraphData
): any {
  // Create the unified GraphDataFile structure using the helper function
  const graphDataFile = createGraphDataFile(graphData, {
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
    }
  });

  return graphDataFile;
}
