import { useMemo } from 'react';
import { GraphData, ProjectionConfig } from '../core/types';
import { projectGraph } from '../core/projection';

export function useProjection(
  data: GraphData,
  config: ProjectionConfig
) {
  return useMemo(() => {
    return projectGraph(data, config);
  }, [data, config]);
}
