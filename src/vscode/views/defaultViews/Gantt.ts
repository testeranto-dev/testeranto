import type { GraphData } from "../../../graph";

export type GanttItem = {
  id: string;
  label: string;
  startDate?: string;
  dueDate?: string;
  timestamp?: string;
  metadata?: {
    frontmatter?: {
      startDate?: string;
      dueDate?: string;
    };
  };
}

export type IGantt = {
  items: GanttItem[];
  viewType: 'gantt';
  timestamp: string;
}

export const GanttSlicer = (graphData: GraphData): IGantt => {
  const items: GanttItem[] = graphData.nodes
    .filter(node =>
      node.timestamp ||
      node.metadata?.frontmatter?.dueDate ||
      node.metadata?.frontmatter?.startDate
    )
    .map(node => ({
      id: node.id,
      label: node.label || node.id,
      startDate: node.metadata?.frontmatter?.startDate,
      dueDate: node.metadata?.frontmatter?.dueDate,
      timestamp: node.timestamp,
      metadata: node.metadata
    }));

  return {
    items,
    viewType: 'gantt',
    timestamp: new Date().toISOString()
  };
}

export default {
  slicer: GanttSlicer,
  filePath: 'src/views/defaultViews/GanttView.tsx'
}
