import type { GraphDataFile } from ".";
import { isGraphData } from "./isGraphData";

// Type guard to check if an object is GraphDataFile
export function isGraphDataFile(obj: any): obj is GraphDataFile {
  return (
    obj &&
    typeof obj.timestamp === 'string' &&
    typeof obj.version === 'string' &&
    obj.data &&
    isGraphData(obj.data.unifiedGraph) &&
    (!obj.data.vizConfig || (
      obj.data.vizConfig.projection &&
      typeof obj.data.vizConfig.projection.xAttribute === 'string' &&
      typeof obj.data.vizConfig.projection.yAttribute === 'string' &&
      ['categorical', 'continuous', 'ordinal', 'temporal'].includes(obj.data.vizConfig.projection.xType) &&
      ['categorical', 'continuous', 'ordinal', 'temporal'].includes(obj.data.vizConfig.projection.yType) &&
      ['grid', 'force', 'tree', 'timeline', 'none'].includes(obj.data.vizConfig.projection.layout) &&
      obj.data.vizConfig.style &&
      typeof obj.data.vizConfig.style.nodeSize === 'number' &&
      typeof obj.data.vizConfig.style.nodeColor === 'string' &&
      typeof obj.data.vizConfig.style.nodeShape === 'string'
    ))
  );
}
