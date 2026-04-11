// DO NOT PUT THE VIEW IN THIS FILE

import type { GraphData } from "../../graph"
import type { IView } from "../../Types";

export type KanbanItem = {
  id: string;
  label: string;
  status?: string;
  priority?: string;
  metadata?: {
    frontmatter?: {
      status?: string;
      priority?: string;
      title?: string;
      description?: string;
    };
  };
}

export type IKanban = {
  items: KanbanItem[];
  viewType: 'kanban';
  timestamp: string;
}

export const KanbanSlicer = (graphData: GraphData): IKanban => {
  const items: KanbanItem[] = graphData.nodes
    .filter(node =>
      node.type === 'feature' ||
      node.id?.startsWith('feature:') ||
      (node.metadata?.frontmatter?.status !== undefined)
    )
    .map(node => ({
      id: node.id,
      label: node.label || node.id,
      status: node.metadata?.frontmatter?.status,
      priority: node.metadata?.frontmatter?.priority,
      metadata: node.metadata
    }));

  return {
    items,
    viewType: 'kanban',
    timestamp: new Date().toISOString()
  };
}

export default {
  slicer: KanbanSlicer,
  filePath: 'src/views/defaultViews/KanbanBoardView.tsx'
} as IView;
