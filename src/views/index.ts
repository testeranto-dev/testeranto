// Default views for Testeranto
// These are the 3 existing apps migrated from the stakeholder app

export const VscodeViews = {
  featuretree: 'testeranto/views/vscode/featuretree',
  debugVisualization: 'testeranto/views/vscode/debugVisualization',
  // Add more default vscode views here
} as const;

export const Stakeholderviews = {
  Kanban: 'testeranto/views/stakeholder/Kanban',
  Gantt: 'testeranto/views/stakeholder/Gantt',
  Eisenhower: 'testeranto/views/stakeholder/Eisenhower',
  // Add more default stakeholder views here
} as const;

// Type exports
export type VscodeViewKey = keyof typeof VscodeViews;
export type StakeholderViewKey = keyof typeof Stakeholderviews;
