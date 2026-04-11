import React from 'react';
import type { GraphData } from '../../graph';
import type { VizConfig } from '../../grafeovidajo';
import { BaseViewClass } from '../BaseViewClass';

export interface GanttConfig extends VizConfig {
  timeRange: [Date, Date];
  rowHeight: number;
  showDependencies: boolean;
}

export class Gantt extends BaseViewClass<GraphData> {
  get config(): GanttConfig {
    return this.props.config || {
      timeRange: [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)],
      rowHeight: 40,
      showDependencies: true
    };
  }

  renderTimeline() {
    const { width = 800, height = 600 } = this.props;
    const [startTime, endTime] = this.config.timeRange;
    const totalDuration = endTime.getTime() - startTime.getTime();
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
  }

  renderDataBars() {
    const { width = 800, height = 600 } = this.props;
    const [startTime, endTime] = this.config.timeRange;
    const totalDuration = endTime.getTime() - startTime.getTime();
    const data = this.state.data;

    if (!data || !data.nodes) return null;

    return data.nodes.map((node, index) => {
      const startDate = node.timestamp ? new Date(node.timestamp) :
        node.metadata?.frontmatter?.startDate ? new Date(node.metadata.frontmatter.startDate) :
          startTime;
      const endDate = node.metadata?.frontmatter?.dueDate ? new Date(node.metadata.frontmatter.dueDate) :
        new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

      const startX = ((startDate.getTime() - startTime.getTime()) / totalDuration) * width;
      const endX = ((endDate.getTime() - startTime.getTime()) / totalDuration) * width;
      const barWidth = Math.max(endX - startX, 5);
      const y = 50 + index * this.config.rowHeight;

      return (
        <g
          key={`bar-${node.id}`}
          onClick={() => (this.props as any).onNodeClick?.(node)}
          onMouseEnter={() => (this.props as any).onNodeHover?.(node)}
          onMouseLeave={() => (this.props as any).onNodeHover?.(null)}
          style={{ cursor: (this.props as any).onNodeClick ? 'pointer' : 'default' }}
        >
          <rect
            x={startX}
            y={y}
            width={barWidth}
            height={this.config.rowHeight - 10}
            fill="#4a90e2"
            rx={3}
          />
          <text
            x={startX + 5}
            y={y + this.config.rowHeight / 2}
            fontSize={11}
            fill="white"
            dominantBaseline="middle"
          >
            {node.label || node.id}
          </text>
        </g>
      );
    });
  }

  renderContent() {
    const { width = 800, height = 600 } = this.props;

    return (
      <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
        <svg width={width} height={height} style={{ border: '1px solid #ccc', background: 'white' }}>
          {this.renderTimeline()}
          {this.renderDataBars()}
        </svg>
      </div>
    );
  }
}

// Wrapper component for backward compatibility
export const GanttView: React.FC<{ slicePath: string; width?: number; height?: number }> = ({
  slicePath,
  width = 800,
  height = 600
}) => {
  return (
    <Gantt
      slicePath={slicePath}
      width={width}
      height={height}
    />
  );
};

// Default export for the view
export default GanttView;
