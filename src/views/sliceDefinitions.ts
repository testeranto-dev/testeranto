import type { GraphData } from "../graph";

export interface SliceFunction {
  (graphData: GraphData): GraphData;
}

export const sliceDefinitions: Record<string, SliceFunction> = {
  // Feature tree slice
  featuretree: (graphData: GraphData): GraphData => {
    // Filter to feature nodes and their relationships
    const featureNodes = graphData.nodes.filter(node =>
      node.type === 'feature' ||
      node.id.startsWith('feature:')
    );

    const featureEdges = graphData.edges.filter(edge =>
      featureNodes.some(n => n.id === edge.source) &&
      featureNodes.some(n => n.id === edge.target)
    );

    return {
      nodes: featureNodes,
      edges: featureEdges,
      metadata: {
        ...graphData.metadata,
        viewType: 'featuretree',
        timestamp: new Date().toISOString()
      }
    };
  },

  // Debug visualization slice
  // debugVisualization: (graphData: GraphData): GraphData => {
  //   // For debug, include everything but add view-specific metadata
  //   return {
  //     ...graphData,
  //     metadata: {
  //       ...graphData.metadata,
  //       viewType: 'debug',
  //       config: {
  //         showNodeIds: true,
  //         showEdgeLabels: true
  //       },
  //       timestamp: new Date().toISOString()
  //     }
  //   };
  // },

  // Kanban slice
  // Kanban: (graphData: GraphData): GraphData => {
  //   // Filter feature nodes with status
  //   const featureNodes = graphData.nodes.filter(node =>
  //     node.type === 'feature' ||
  //     node.id.startsWith('feature:') ||
  //     (node.metadata?.frontmatter?.status !== undefined)
  //   );

  //   const featureEdges = graphData.edges.filter(edge =>
  //     featureNodes.some(n => n.id === edge.source) &&
  //     featureNodes.some(n => n.id === edge.target)
  //   );

  //   return {
  //     nodes: featureNodes,
  //     edges: featureEdges,
  //     metadata: {
  //       ...graphData.metadata,
  //       viewType: 'kanban',
  //       timestamp: new Date().toISOString()
  //     }
  //   };
  // },

  // Gantt slice
  // Gantt: (graphData: GraphData): GraphData => {
  //   // Filter nodes with timestamps
  //   const nodesWithTime = graphData.nodes.filter(node =>
  //     node.timestamp ||
  //     node.metadata?.frontmatter?.dueDate ||
  //     node.metadata?.frontmatter?.startDate
  //   );

  //   const edgesWithTime = graphData.edges.filter(edge =>
  //     nodesWithTime.some(n => n.id === edge.source) &&
  //     nodesWithTime.some(n => n.id === edge.target)
  //   );

  //   return {
  //     nodes: nodesWithTime,
  //     edges: edgesWithTime,
  //     metadata: {
  //       ...graphData.metadata,
  //       viewType: 'gantt',
  //       timestamp: new Date().toISOString()
  //     }
  //   };
  // },

  // Eisenhower slice
  // Eisenhower: (graphData: GraphData): GraphData => {
  //   // Filter nodes with urgency and importance
  //   const nodesWithUrgencyImportance = graphData.nodes.filter(node =>
  //     (node.metadata?.frontmatter?.urgency !== undefined) ||
  //     (node.metadata?.frontmatter?.importance !== undefined)
  //   );

  //   const edgesWithUrgencyImportance = graphData.edges.filter(edge =>
  //     nodesWithUrgencyImportance.some(n => n.id === edge.source) &&
  //     nodesWithUrgencyImportance.some(n => n.id === edge.target)
  //   );

  //   return {
  //     nodes: nodesWithUrgencyImportance,
  //     edges: edgesWithUrgencyImportance,
  //     metadata: {
  //       ...graphData.metadata,
  //       viewType: 'eisenhower',
  //       timestamp: new Date().toISOString()
  //     }
  //   };
  // }
};

// Helper to get slice function for a view key
export function getSliceFunction(viewKey: string): SliceFunction | undefined {
  return sliceDefinitions[viewKey];
}

// Helper to check if a view has a slice definition
export function hasSliceDefinition(viewKey: string): boolean {
  return viewKey in sliceDefinitions;
}
