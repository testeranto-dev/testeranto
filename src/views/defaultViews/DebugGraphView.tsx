import React from 'react';
import type { GraphData } from '../../graph';
import { BaseViewClass } from '../BaseViewClass';
import { SigmaDebugGraph } from "./SigmaDebugGraph";

export interface DebugGraphConfig {
  nodeColor?: string;
  edgeColor?: string;
  nodeSize?: number;
  edgeSize?: number;
  showLabels?: boolean;
  labelSize?: number;
  labelColor?: string;
  labelThreshold?: number;
}

export class DebugGraph extends BaseViewClass<GraphData> {
  private containerRef: React.RefObject<HTMLDivElement>;

  constructor(props: any) {
    super(props);
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    super.componentDidMount?.();
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      this.checkContainerDimensions();
      // Force a re-render to ensure dimensions are applied
      this.forceUpdate();
    });
    window.addEventListener('resize', this.checkContainerDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.checkContainerDimensions);
    super.componentWillUnmount?.();
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
      // Force check when dimensions change
      this.checkContainerDimensions();
    }
  }

  checkContainerDimensions = () => {
    if (this.containerRef.current) {
      const { width, height } = this.containerRef.current.getBoundingClientRect();
      if (width === 0 || height === 0) {
        console.warn('DebugGraph container has no dimensions, setting defaults');
        // Instead of throwing, we'll set default dimensions
        // The container should have dimensions from props
      }
    }
  };

  get config(): DebugGraphConfig {
    return this.props.config || {
      nodeColor: '#4a90e2',
      edgeColor: '#999',
      nodeSize: 5,
      edgeSize: 1,
      showLabels: true,
      labelSize: 12,
      labelColor: '#333',
      labelThreshold: 5
    };
  }

  renderContent() {
    const { width = 800, height = 600 } = this.props;
    const data = this.state.data;

    console.log(`[DebugGraphView.renderContent] width: ${width}, height: ${height}, has data: ${!!data}`);

    if (!data) {
      console.error('[DebugGraphView] No graph data available');
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 255, 0.1)'
        }}>
          <div>Loading graph data...</div>
        </div>
      );
    }

    const config = this.config;

    // Ensure we have valid dimensions
    const actualWidth = Math.max(width > 0 ? width : 800, 400);
    const actualHeight = Math.max(height > 0 ? height : 600, 400);

    console.log(`[DebugGraphView] Actual dimensions: ${actualWidth}x${actualHeight}`);

    // Check if data has nodes
    if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 255, 0.1)'
        }}>
          <div>No graph nodes available</div>
        </div>
      );
    }

    return (
      <div
        ref={this.containerRef}
        style={{
          width: `${actualWidth}px`,
          height: `${actualHeight}px`,
          border: '3px solid blue', // Debug border
          borderRadius: '4px',
          overflow: 'hidden',
          minWidth: '400px',
          minHeight: '400px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(0, 0, 255, 0.1)' // Semi-transparent blue background
        }}
      >
        <React.Suspense fallback={
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div>Loading Sigma.js graph viewer...</div>
          </div>
        }>
          <SigmaDebugGraph
            data={data}
            config={config}
            width={actualWidth}
            height={actualHeight}
            onNodeClick={(this.props as any).onNodeClick}
            onNodeHover={(this.props as any).onNodeHover}
          />
        </React.Suspense>
      </div>
    );
  }
}

export const DebugGraphView: React.FC<{ slicePath: string; width?: number; height?: number }> = ({
  slicePath,
  width = 800,
  height = 600
}) => {
  return (
    <DebugGraph
      slicePath={slicePath}
      width={width}
      height={height}
    />
  );
};

export default DebugGraphView;
