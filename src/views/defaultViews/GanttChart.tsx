import React from 'react';
import { BaseChart } from './BaseChart';
import type { GraphData } from '../../graph';
import type { VizConfig, VizComponentProps } from '../../grafeovidajo';

export const Gantt = (graphData: GraphData): GraphData => {
  // Filter nodes with timestamps
  const nodesWithTime = graphData.nodes.filter(node =>
    node.timestamp ||
    node.metadata?.frontmatter?.dueDate ||
    node.metadata?.frontmatter?.startDate
  );

  const edgesWithTime = graphData.edges.filter(edge =>
    nodesWithTime.some(n => n.id === edge.source) &&
    nodesWithTime.some(n => n.id === edge.target)
  );

  return {
    nodes: nodesWithTime,
    edges: edgesWithTime,
  };
}

export interface GanttConfig extends VizConfig {
  timeRange: [Date, Date];
  rowHeight: number;
  showDependencies: boolean;
}

export const GanttChart: React.FC<VizComponentProps & { config: GanttConfig }> = (props) => {
  const { config, width, height } = props;
  const [startTime, endTime] = config.timeRange;
  const totalDuration = endTime.getTime() - startTime.getTime();

  // Render timeline
  const renderTimeline = () => {
    const hours = Math.ceil(totalDuration / (1000 * 60 * 60));
    const segments = Math.min(hours, 24);

    return Array.from({ length: segments }).map((_, i) => {
      const x = (i / segments) * width;
      const time = new Date(startTime.getTime() + (i / segments) * totalDuration);

      return (
        <g key={`timeline-${i}`}>
          <line
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke="#eee"
            strokeWidth={1}
          />
          <text
            x={x}
            y={15}
            textAnchor="middle"
            fontSize={10}
            fill="#666"
          >
            {time.getHours().toString().padStart(2, '0')}:00
          </text>
        </g>
      );
    });
  };

  return (
    <svg width={width} height={height} style={{ border: '1px solid #ccc' }}>
      {renderTimeline()}
      <BaseChart {...props} />
    </svg>
  );
};

// TODO
export const GanttSlice = () => {

}