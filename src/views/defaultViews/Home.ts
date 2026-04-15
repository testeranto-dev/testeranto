import type { GraphData } from "../../graph";

export type IHome = {
  views: Array<{
    id: string;
    label: string;
    description?: string;
    type: string;
    metadata?: Record<string, any>;
  }>;
  viewType: 'home';
  timestamp: string;
  // Include default views as fallback
  defaultViews: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
}

export const HomeSlicer = (graphData: GraphData): IHome => {
  // Extract view nodes from graph
  const graphViews = graphData.nodes
    .filter(node => {
      // Check if node.type is an object with category 'view' and type 'view'
      if (node.type && typeof node.type === 'object') {
        return node.type.category === 'view' && node.type.type === 'view';
      }
      // For backward compatibility, also check string type
      return node.type === 'view' ||
             (node.attributes?.type && node.attributes.type === 'view');
    })
    .map(node => ({
      id: node.id,
      label: node.label || node.id,
      description: node.description || node.attributes?.description,
      type: 'view',
      metadata: node.metadata || node.attributes
    }));

  // Default views as fallback
  const defaultViews = [
    { id: 'kanban', label: 'Kanban', description: 'Kanban board for task management' },
    { id: 'eisenhower-matrix', label: 'Eisenhower Matrix', description: 'Priority matrix for task categorization' },
    { id: 'gantt', label: 'Gantt', description: 'Timeline view for project scheduling' },
    { id: 'chat', label: 'Chat', description: 'Chat message viewer' },
    { id: 'debug-graph', label: 'Debug Graph', description: 'Interactive graph visualization using Sigma.js' },
    { id: 'home', label: 'Home', description: 'Home page with links to all views' }
  ];

  // Combine graph views and default views
  // Use graph views if available, otherwise use default views
  const views = graphViews.length > 0 ? graphViews : defaultViews.map(view => ({
    ...view,
    type: 'view',
    metadata: { isDefault: true }
  }));

  return {
    views,
    viewType: 'home',
    timestamp: new Date().toISOString(),
    defaultViews
  };
}

export default {
  slicer: HomeSlicer,
  filePath: 'src/views/defaultViews/HomeView.tsx'
}
