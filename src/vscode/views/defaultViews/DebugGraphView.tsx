import React from 'react';
import type { GraphData } from '../../../graph';
import { BaseViewClass } from '../BaseViewClass';
import { DebugGraphThree } from './DebugGraphThree';
import { DebugGraphSidePanel } from './DebugGraphSidePanel';
import { DebugGraphInspector } from './DebugGraphInspector';
import { getDefaultConfig } from './DebugGraphUtils';
import type { SelectedElement } from './DebugGraphUtils';

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

export class DebugGraphView extends BaseViewClass<GraphData> {
  private selectedElement: SelectedElement | null = null;
  private hoveredNode: string | null = null;
  private hoveredEdge: string | null = null;

  constructor(props: any) {
    super(props);
    this.state = { ...this.state, selectedElement: null, hoveredNode: null, hoveredEdge: null };
  }

  get config(): DebugGraphConfig {
    return this.props.config || getDefaultConfig();
  }

  private handleNodeClick = (node: any) => {
    this.selectedElement = { type: 'node', id: node.id, data: node };
    this.setState({ selectedElement: this.selectedElement });
  };

  private handleEdgeClick = (edge: any) => {
    this.selectedElement = { type: 'edge', id: edge.id, data: edge };
    this.setState({ selectedElement: this.selectedElement });
  };

  private handleNodeHover = (node: any | null) => {
    this.hoveredNode = node ? node.id : null;
    this.setState({ hoveredNode: this.hoveredNode });
  };

  private handleEdgeHover = (edge: any | null) => {
    this.hoveredEdge = edge ? edge.id : null;
    this.setState({ hoveredEdge: this.hoveredEdge });
  };

  renderContent() {
    const data = this.state.data;

    console.log(`[DebugGraphView.renderContent] has data: ${!!data}`);

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
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden'
      }}>
        <DebugGraphSidePanel
          data={data}
          onNodeClick={this.handleNodeClick}
          onEdgeClick={this.handleEdgeClick}
        />

        <DebugGraphThree
          data={data}
          config={config}
          onNodeClick={this.handleNodeClick}
          onNodeHover={this.handleNodeHover}
          onEdgeClick={this.handleEdgeClick}
          onEdgeHover={this.handleEdgeHover}
        />

        {/* Column 4: Inspector */}
        <div style={{
          flex: 1,
          minWidth: '150px',
          maxWidth: '25%',
          borderLeft: '1px solid #ccc',
          backgroundColor: '#fafafa',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '12px'
        }}>
          <div style={{
            padding: '8px',
            borderBottom: '1px solid #ccc',
            backgroundColor: '#e0e0e0',
            fontWeight: 'bold'
          }}>
            Inspector
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
            <DebugGraphInspector
              selectedElement={this.state.selectedElement as SelectedElement | null}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default DebugGraphView;
