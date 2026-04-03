import React from 'react';
import { BaseChart, VizComponentProps } from './BaseChart';
import { VizConfig, Node } from '../core/types';

export interface KanbanConfig extends VizConfig {
  columns: Array<{
    id: string;
    title: string;
    statusFilter: (node: Node) => boolean;
    width: number;
  }>;
}

// Helper function to safely get node attributes
const getSafeNodeAttributes = (node: Node): Record<string, any> => {
  return node.attributes || {};
};

export const KanbanBoard: React.FC<VizComponentProps & { config: KanbanConfig }> = (props) => {
  const { config, width, height } = props;
  
  // Render columns
  const renderColumns = () => {
    let currentX = 0;
    
    return config.columns.map((column, index) => {
      const columnWidth = (column.width / 100) * width;
      const columnX = currentX;
      currentX += columnWidth;
      
      // Safely filter nodes with defensive programming
      const columnNodes = props.data.nodes.filter(node => {
        if (!node) return false;
        
        // Create a safe node object with guaranteed attributes
        const safeNode = {
          id: node.id || '',
          attributes: getSafeNodeAttributes(node)
        };
        
        try {
          return column.statusFilter(safeNode);
        } catch (error) {
          console.warn(`Error in statusFilter for column "${column.title}":`, error);
          return false;
        }
      });
      
      return (
        <g key={`column-${column.id}`}>
          <rect
            x={columnX}
            y={0}
            width={columnWidth}
            height={height}
            fill="#f5f5f5"
            stroke="#ddd"
            strokeWidth={1}
          />
          <text
            x={columnX + columnWidth / 2}
            y={25}
            textAnchor="middle"
            fontWeight="bold"
            fontSize={14}
          >
            {column.title} ({columnNodes.length})
          </text>
        </g>
      );
    });
  };
  
  return (
    <svg width={width} height={height} style={{ border: '1px solid #ccc' }}>
      {renderColumns()}
      <BaseChart {...props} />
    </svg>
  );
};
