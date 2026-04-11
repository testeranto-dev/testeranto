// DO NOT PUT THE VIEW IN THIS FILE

import type { GraphData } from "../../graph"

export type EisenhowerItem = {
  id: string;
  label: string;
  urgency?: number;
  importance?: number;
  metadata?: {
    frontmatter?: {
      urgency?: number; 
      importance?: number;
    };
  };
}

export type IEisenhower = {
  items: EisenhowerItem[];
  viewType: 'eisenhower';
  timestamp: string;
}

export const EisenhowerMatrixSlicer = (graphData: GraphData): IEisenhower => {
  const items: EisenhowerItem[] = graphData.nodes
    .filter(node =>
      (node.metadata?.frontmatter?.urgency !== undefined) ||
      (node.metadata?.frontmatter?.importance !== undefined)
    )
    .map(node => ({
      id: node.id,
      label: node.label || node.id,
      urgency: node.metadata?.frontmatter?.urgency,
      importance: node.metadata?.frontmatter?.importance,
      metadata: node.metadata
    }));

  return {
    items,
    viewType: 'eisenhower',
    timestamp: new Date().toISOString()
  };
}

export default {
  slicer: EisenhowerMatrixSlicer,
  filePath: 'src/views/defaultViews/EisenhowerMatrixView.tsx'
}
