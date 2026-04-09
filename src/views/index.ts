export const Views = {
  featuretree: 'testeranto/views/vscode/featuretree',
  debugVisualization: 'testeranto/views/vscode/debugVisualization',
  Kanban: 'testeranto/views/stakeholder/Kanban',
  Gantt: 'testeranto/views/stakeholder/Gantt',
  Eisenhower: 'testeranto/views/stakeholder/Eisenhower',
} as const;


// Type exports
export type VscodeViewKey = keyof typeof Views;
