export { View } from './View';
export { ViewManager, useViewManager } from './ViewManager';
export { compileView } from './compileView';
export { initView } from './viewRuntime';

export { KanbanBoard } from './defaultViews/KanbanBoard';
export { GanttChart } from './defaultViews/GanttChart';
export { EisenhowerMatrix } from './defaultViews/EisenhowerMatrix';
export { BaseChart } from './defaultViews/BaseChart';
export { NodeDetailsModal } from './defaultViews/NodeDetailsModal';

// Export slice definitions
export { sliceDefinitions, getSliceFunction, hasSliceDefinition } from './sliceDefinitions';
export type { SliceFunction } from './sliceDefinitions';

export type { ViewProps } from './View';
export type { ViewConfig, ViewManagerProps } from './ViewManager';
export type { CompileViewOptions } from './compileView';
export type { ViewRuntimeOptions } from './viewRuntime';
export type { KanbanConfig } from './defaultViews/KanbanBoard';
export type { GanttConfig } from './defaultViews/GanttChart';
export type { EisenhowerConfig } from './defaultViews/EisenhowerMatrix';

export const Views = {
  // featuretree: 'testeranto/views/vscode/featuretree',
  // debugVisualization: 'testeranto/views/vscode/debugVisualization',
  Kanban: 'testeranto/views/stakeholder/Kanban',
  Gantt: 'testeranto/views/stakeholder/Gantt',
  Eisenhower: 'testeranto/views/stakeholder/Eisenhower',
} as const;

export type VscodeViewKey = keyof typeof Views;
