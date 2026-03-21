import React from 'react';
import { BaseChart, VizComponentProps } from './BaseChart';
import { VizConfig } from '../core/types';

export interface EisenhowerConfig extends VizConfig {
  quadrants: {
    urgentImportant: { x: [number, number]; y: [number, number] };
    notUrgentImportant: { x: [number, number]; y: [number, number] };
    urgentNotImportant: { x: [number, number]; y: [number, number] };
    notUrgentNotImportant: { x: [number, number]; y: [number, number] };
  };
}

export const EisenhowerMatrix: React.FC<VizComponentProps & { config: EisenhowerConfig }> = (props) => {
  const { config, width, height } = props;
  
  // Render quadrant lines
  const renderQuadrantLines = () => {
    const midX = width / 2;
    const midY = height / 2;
    
    return (
      <>
        <line
          x1={midX}
          y1={0}
          x2={midX}
          y2={height}
          stroke="#ccc"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
        <line
          x1={0}
          y1={midY}
          x2={width}
          y2={midY}
          stroke="#ccc"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
        <text x={width * 0.25} y={20} textAnchor="middle" fontWeight="bold">
          Urgent
        </text>
        <text x={width * 0.75} y={20} textAnchor="middle" fontWeight="bold">
          Not Urgent
        </text>
        <text x={10} y={height * 0.25} textAnchor="start" fontWeight="bold" transform={`rotate(-90, 10, ${height * 0.25})`}>
          Important
        </text>
        <text x={10} y={height * 0.75} textAnchor="start" fontWeight="bold" transform={`rotate(-90, 10, ${height * 0.75})`}>
          Not Important
        </text>
      </>
    );
  };
  
  return (
    <svg width={width} height={height} style={{ border: '1px solid #ccc' }}>
      {renderQuadrantLines()}
      <BaseChart {...props} />
    </svg>
  );
};
