// DO NOT PUT THE VIEW IN THIS FILE

import type { GraphData } from "../../../graph"
import type { IView } from "../../../Types";

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
    .filter(node => {
      // Check if node is a feature node by multiple indicators

      // 1. Check by type object (preferred way)
      if (node.type && typeof node.type === 'object') {
        // Feature nodes should have category 'file' and type 'feature'
        if (node.type.category === 'file' && node.type.type === 'feature') {
          return true;
        }
        // Reject other file types (input files, source code, etc.)
        if (node.type.category === 'file' && node.type.type !== 'feature') {
          return false;
        }
      }

      // 2. Check by string type (for backward compatibility)
      if (typeof node.type === 'string') {
        if (node.type === 'feature') {
          return true;
        }
        // Reject other types
        if (['test', 'input_file', 'output_file', 'process', 'verb', 'agent', 'view'].includes(node.type)) {
          return false;
        }
      }

      // 3. Check by id prefix
      if (node.id?.startsWith('feature:')) {
        return true;
      }

      // 4. Check by metadata
      if (node.metadata?.feature) {
        return true;
      }

      // 5. Check if it's a markdown file with frontmatter
      if (node.metadata?.frontmatter) {
        // Only include if it's likely a feature (has status, priority, etc.)
        if (node.metadata.frontmatter.status || node.metadata.frontmatter.priority) {
          return true;
        }
      }

      // Exclude nodes that are clearly not features
      // Check for test-related nodes
      if (node.id?.includes('test:') || node.id?.includes('entrypoint:') ||
        node.id?.includes('process:') || node.id?.includes('verb:')) {
        return false;
      }

      // By default, exclude nodes that don't clearly indicate they're features
      return false;
    })
    .map(node => {
      // Determine status from various sources
      let status = node.status;
      let priority = node.priority;

      // Check frontmatter first (from markdown files)
      if (node.metadata?.frontmatter) {
        if (node.metadata.frontmatter.status) {
          status = node.metadata.frontmatter.status;
        }
        if (node.metadata.frontmatter.priority) {
          priority = node.metadata.frontmatter.priority;
        }
      }

      // Fallback to metadata directly
      if (!status && node.metadata?.status) {
        status = node.metadata.status;
      }
      if (!priority && node.metadata?.priority) {
        priority = node.metadata.priority;
      }

      // Default status if none found
      if (!status) {
        status = 'todo';
      }

      // Create a clean label
      let label = node.label || node.id;
      // Remove prefixes for cleaner display
      if (label.startsWith('Feature: ')) {
        label = label.substring('Feature: '.length);
      }
      if (node.id?.startsWith('feature:')) {
        // Extract the actual feature path from the id
        const parts = node.id.split(':');
        if (parts.length > 3) {
          label = parts.slice(3).join(':');
        }
      }

      return {
        id: node.id,
        label: label,
        status: status,
        priority: priority,
        metadata: node.metadata
      };
    });

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
