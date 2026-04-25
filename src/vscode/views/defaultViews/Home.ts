import type { GraphData } from "../../../graph";

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
}

export const HomeSlicer = (graphData: GraphData): IHome => {
  // Extract view nodes from graph using the new GraphNodeType structure
  const views = graphData.nodes
    .filter(node => {
      // node.type is an object with category and type
      if (node.type && typeof node.type === 'object') {
        return node.type.category === 'view' && node.type.type === 'view';
      }
      return false;
    })
    .map(node => ({
      id: node.id,
      label: node.label || node.id,
      description: node.description,
      type: 'view',
      metadata: node.metadata
    }));

  return {
    views,
    viewType: 'home',
    timestamp: new Date().toISOString()
  };
}

export default {
  slicer: HomeSlicer,
  filePath: 'src/views/defaultViews/HomeView.tsx'
}
