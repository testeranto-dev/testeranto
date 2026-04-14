import { execSync } from "child_process";

export function getViewName(key: string): string {
  // Convert key to display name
  switch (key) {
    case 'featuretree':
      return 'Feature Tree';
    case 'debugVisualization':
      return 'Debug Visualization';
    case 'Kanban':
      return 'Kanban Board';
    case 'Gantt':
      return 'Gantt Chart';
    case 'Eisenhower':
      return 'Eisenhower Matrix';
    default:
      // Convert camelCase or snake_case to Title Case
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, str => str.toUpperCase())
        .trim();
  }
}
