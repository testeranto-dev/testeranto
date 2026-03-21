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

export const KanbanBoard: React.FC<VizComponentProps & { config: KanbanConfig }> = (props) => {
  const { config, width, height } = props;
  
  // Render columns
  const renderColumns = () => {
    let currentX = 0;
    
    return config.columns.map((column, index) => {
      const columnWidth = (column.width / 100) * width;
      const columnX = currentX;
      currentX += columnWidth;
      
      const columnNodes = props.data.nodes.filter(column.statusFilter);
      
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
