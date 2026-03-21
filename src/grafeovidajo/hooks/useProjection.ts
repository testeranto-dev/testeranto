import { useMemo } from 'react';

import { projectGraph } from '../core/projection';
// import type { GraphData } from '..';
// import type { ProjectionConfig } from '..';

export function useProjection(
  data: any,
  config: any
) {
  return useMemo(() => {
    return projectGraph(data, config);
  }, [data, config]);
}
