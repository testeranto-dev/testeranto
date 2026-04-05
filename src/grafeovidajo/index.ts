// Core exports
export * from './core/types';
export * from './core/projection';
export * from './core/layout';
export * from './core/styling';

// Chart exports
export { BaseChart } from './charts/BaseChart';
export { EisenhowerMatrix } from './charts/EisenhowerMatrix';
export { GanttChart } from './charts/GanttChart';
export { KanbanBoard } from './charts/KanbanBoard';
export { TreeGraph } from './charts/TreeGraph';
export { DebugGraph } from './charts/DebugGraph';

// Types re-exports
export type {
  GraphData,
  Node,
  Edge,
  ProjectionConfig,
  StyleConfig,
  VizConfig,
  VizComponentProps
} from './core/types';

// Export DebugConfig type
export type { DebugConfig } from './charts/DebugGraph';
