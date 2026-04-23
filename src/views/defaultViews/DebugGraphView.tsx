import React from 'react';
import type { GraphData } from '../../graph';
import { BaseViewClass } from '../BaseViewClass';
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSetSettings, useSigma } from '@react-sigma/core';
import { DirectedGraph } from 'graphology';

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

interface SelectedElement {
  type: 'node' | 'edge';
  id: string;
  data: Record<string, any>;
}

const SigmaGraph: React.FC<{
  data: GraphData;
  config: DebugGraphConfig;
  width: number;
  height: number;
  onNodeClick?: (node: any) => void;
  onNodeHover?: (node: any | null) => void;
  onEdgeClick?: (edge: any) => void;
  onEdgeHover?: (edge: any | null) => void;
  hoveredNode?: string | null;
  hoveredEdge?: string | null;
}> = (props) => {
  const { data, config, onNodeClick, onNodeHover, onEdgeClick, onEdgeHover, hoveredNode, hoveredEdge, width, height } = props;
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const setSettings = useSetSettings();
  const loadGraph = useLoadGraph();

  React.useEffect(() => {
    if (!sigma) {
      return;
    }

    if (!data || !data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      return;
    }

    const graph = new DirectedGraph();

    data.nodes.forEach((node, index) => {
      const nodeId = node.id || `node-${index}`;
      if (graph.hasNode(nodeId)) {
        return;
      }
      graph.addNode(nodeId, {
        size: config.nodeSize || 8,
        color: config.nodeColor || '#4a90e2',
        x: Math.random() * 100,
        y: Math.random() * 100,
        originalColor: config.nodeColor || '#4a90e2',
        originalSize: config.nodeSize || 8,
        label: node.label || nodeId,
        nodeData: node
      });
    });

    if (data.edges && Array.isArray(data.edges)) {
      data.edges.forEach((edge, index) => {
        if (edge.source && edge.target) {
          try {
            graph.addEdge(edge.source, edge.target, {
              size: config.edgeSize || 1,
              color: config.edgeColor || '#999',
              type: 'line',
              originalColor: config.edgeColor || '#999',
              originalSize: config.edgeSize || 1,
              edgeData: edge
            });
          } catch (error) {
            console.warn(`[SigmaDebugGraph] Could not add edge ${index}:`, error);
          }
        }
      });
    }

    loadGraph(graph);

    setSettings({
      nodeReducer: (node, data) => {
        const isHovered = hoveredNode === node;
        const isConnected = isHovered || (hoveredNode ? graph.areNeighbors(hoveredNode, node) : false);
        const isEdgeHovered = hoveredEdge !== null;
        const dimmed = (hoveredNode !== null && !isHovered && !isConnected) || (hoveredEdge !== null && !isEdgeHovered);
        return {
          ...data,
          size: isHovered ? (data.originalSize || 8) * 2 : (data.originalSize || 8),
          color: isHovered ? '#ff6600' : dimmed ? '#cccccc' : (data.originalColor || '#4a90e2'),
          label: data.label || node,
          zIndex: isHovered ? 10 : dimmed ? 0 : 1
        };
      },
      edgeReducer: (edge, data) => {
        const isHovered = hoveredEdge === edge;
        const isConnectedToHoveredNode = hoveredNode !== null && (graph.source(edge) === hoveredNode || graph.target(edge) === hoveredNode);
        const dimmed = (hoveredNode !== null && !isConnectedToHoveredNode) || (hoveredEdge !== null && !isHovered);
        return {
          ...data,
          size: isHovered ? (data.originalSize || 1) * 3 : isConnectedToHoveredNode ? (data.originalSize || 1) * 1.5 : (data.originalSize || 1),
          color: isHovered ? '#ff6600' : isConnectedToHoveredNode ? '#ff9900' : dimmed ? '#dddddd' : (data.originalColor || '#999'),
          zIndex: isHovered ? 10 : isConnectedToHoveredNode ? 5 : dimmed ? 0 : 1
        };
      },
      renderLabels: true,
      defaultDrawEdgeLabel: () => {},
      defaultDrawNodeLabel: (node, context, settings) => {
        const label = node.label || node.id || '';
        if (!label) return;
        context.font = `${settings.labelSize || 12}px ${settings.labelFont || 'sans-serif'}`;
        context.fillStyle = settings.labelColor || '#333';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(label, node.x, node.y + (node.size || 8) + 4);
      },
      enableHovering: false,
      zIndex: true,
      labelRenderedSizeThreshold: 0,
      labelDensity: 0.07,
      labelFont: 'sans-serif',
      labelSize: config.labelSize || 12,
      labelColor: config.labelColor || '#333',
      labelThreshold: config.labelThreshold || 5
    });

    registerEvents({
      clickNode: (event) => {
        const node = graph.getNodeAttributes(event.node);
        if (onNodeClick) {
          onNodeClick({ id: event.node, ...node });
        }
      },
      clickEdge: (event) => {
        const edge = graph.getEdgeAttributes(event.edge);
        if (onEdgeClick) {
          onEdgeClick({ id: event.edge, ...edge });
        }
      },
      enterNode: (event) => {
        if (onNodeHover) {
          const node = graph.getNodeAttributes(event.node);
          onNodeHover({ id: event.node, ...node });
        }
      },
      leaveNode: () => {
        if (onNodeHover) {
          onNodeHover(null);
        }
      },
      enterEdge: (event) => {
        if (onEdgeHover) {
          const edge = graph.getEdgeAttributes(event.edge);
          onEdgeHover({ id: event.edge, ...edge });
        }
      },
      leaveEdge: () => {
        if (onEdgeHover) {
          onEdgeHover(null);
        }
      }
    });

    const container = sigma.getContainer();

    const timer = setTimeout(() => {
      if (sigma && sigma.getCamera()) {
        sigma.getCamera().animatedReset({ duration: 500 });
        sigma.refresh();
      }

      if (container) {
        if (container.clientWidth === 0 || container.clientHeight === 0) {
          window.dispatchEvent(new Event('resize'));
        }
      }
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      if (sigma && sigma.getCamera()) {
        sigma.refresh();
      }
    });

    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [data, config, loadGraph, setSettings, registerEvents, sigma, onNodeClick, onNodeHover, onEdgeClick, onEdgeHover, hoveredNode, hoveredEdge, width, height]);

  return <></>;
};

export class DebugGraph extends BaseViewClass<GraphData> {
  private selectedElement: SelectedElement | null = null;
  private hoveredNode: string | null = null;
  private hoveredEdge: string | null = null;

  constructor(props: any) {
    super(props);
    this.state = { ...this.state, selectedElement: null, hoveredNode: null, hoveredEdge: null };
  }

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

  private renderDetailsPanel() {
    const selected = this.state.selectedElement as SelectedElement | null;
    if (!selected) {
      return (
        <div style={{
          padding: '12px',
          backgroundColor: '#f0f0f0',
          borderTop: '1px solid #ccc',
          fontSize: '13px',
          color: '#666',
          minHeight: '60px'
        }}>
          Click a node or edge to see its details here.
        </div>
      );
    }

    const data = selected.data;
    const entries = Object.entries(data).filter(([key]) => key !== 'nodeData' && key !== 'edgeData' && key !== 'originalColor' && key !== 'originalSize');

    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#f0f0f0',
        borderTop: '1px solid #ccc',
        fontSize: '13px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
          {selected.type === 'node' ? 'Node' : 'Edge'}: {selected.id}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '4px 8px', fontWeight: 600, color: '#555', width: '120px', verticalAlign: 'top' }}>
                  {key}
                </td>
                <td style={{ padding: '4px 8px', color: '#333', wordBreak: 'break-all' }}>
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  private renderSidePanel() {
    const data = this.state.data as GraphData | null;
    if (!data) return null;

    const nodes = data.nodes || [];
    const edges = data.edges || [];

    return (
      <div style={{
        width: '300px',
        minWidth: '300px',
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
          Nodes ({nodes.length})
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
          {nodes.map((node, idx) => (
            <div
              key={node.id || idx}
              style={{
                padding: '4px 6px',
                margin: '2px 0',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
              onClick={() => {
                this.handleNodeClick({ id: node.id, ...node });
              }}
            >
              <div style={{ fontWeight: 600, color: '#333' }}>
                {node.label || node.id || `node-${idx}`}
              </div>
              <div style={{ color: '#666', fontSize: '10px' }}>
                id: {node.id}
                {node.type && typeof node.type === 'object' && node.type.category ? (
                  <span> | type: {node.type.category}/{node.type.type}</span>
                ) : node.type ? (
                  <span> | type: {typeof node.type === 'string' ? node.type : JSON.stringify(node.type)}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          padding: '8px',
          borderTop: '1px solid #ccc',
          borderBottom: '1px solid #ccc',
          backgroundColor: '#e0e0e0',
          fontWeight: 'bold'
        }}>
          Edges ({edges.length})
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
          {edges.map((edge, idx) => (
            <div
              key={idx}
              style={{
                padding: '4px 6px',
                margin: '2px 0',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
              onClick={() => {
                this.handleEdgeClick({ id: `edge-${idx}`, ...edge });
              }}
            >
              <div style={{ fontWeight: 600, color: '#333' }}>
                {edge.source} → {edge.target}
              </div>
              <div style={{ color: '#666', fontSize: '10px' }}>
                {edge.attributes?.type && typeof edge.attributes.type === 'object' && edge.attributes.type.category ? (
                  <span>type: {edge.attributes.type.category}/{edge.attributes.type.type}</span>
                ) : edge.attributes?.type ? (
                  <span>type: {typeof edge.attributes.type === 'string' ? edge.attributes.type : JSON.stringify(edge.attributes.type)}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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

    const actualWidth = Math.max(width > 0 ? width : 800, 400);
    const actualHeight = Math.max(height > 0 ? height : 600, 400);

    console.log(`[DebugGraphView] Actual dimensions: ${actualWidth}x${actualHeight}`);

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
        width: `${actualWidth}px`,
        minWidth: '400px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'row'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div
            style={{
              height: `${actualHeight}px`,
              overflow: 'hidden',
              minHeight: '400px',
              position: 'relative'
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
              <SigmaContainer
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
                settings={{
                  renderLabels: true,
                  defaultDrawEdgeLabel: () => {},
                  defaultDrawNodeLabel: (node, context, settings) => {
                    const label = node.label || node.id || '';
                    if (!label) return;
                    context.font = `${settings.labelSize || 12}px ${settings.labelFont || 'sans-serif'}`;
                    context.fillStyle = settings.labelColor || '#333';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText(label, node.x, node.y + (node.size || 8) + 4);
                  },
                  enableHovering: false,
                  zIndex: true,
                  defaultNodeColor: config.nodeColor || '#4a90e2',
                  defaultEdgeColor: config.edgeColor || '#999',
                  defaultNodeSize: config.nodeSize || 5,
                  defaultEdgeSize: config.edgeSize || 1,
                  allowInvalidContainer: true,
                  autoResize: true,
                  camera: {
                    ratio: 1,
                    angle: 0,
                    x: 0.5,
                    y: 0.5
                  },
                  labelRenderedSizeThreshold: 0,
                  labelDensity: 0.07,
                  labelFont: 'sans-serif',
                  labelSize: config.labelSize || 12,
                  labelColor: config.labelColor || '#333',
                  labelThreshold: config.labelThreshold || 5
                }}
                graph={null}
                initialSettings={{
                  autoResize: true,
                  allowInvalidContainer: false,
                  renderLabels: true,
                  defaultDrawEdgeLabel: () => {},
                  defaultDrawNodeLabel: (node, context, settings) => {
                    const label = node.label || node.id || '';
                    if (!label) return;
                    context.font = `${settings.labelSize || 12}px ${settings.labelFont || 'sans-serif'}`;
                    context.fillStyle = settings.labelColor || '#333';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText(label, node.x, node.y + (node.size || 8) + 4);
                  },
                  enableHovering: false,
                  labelRenderedSizeThreshold: 0,
                  labelDensity: 0.07,
                  labelFont: 'sans-serif',
                  labelSize: config.labelSize || 12,
                  labelColor: config.labelColor || '#333',
                  labelThreshold: config.labelThreshold || 5
                }}
              >
                <SigmaGraph
                  data={data}
                  config={config}
                  width={actualWidth}
                  height={actualHeight}
                  onNodeClick={this.handleNodeClick}
                  onNodeHover={this.handleNodeHover}
                  onEdgeClick={this.handleEdgeClick}
                  onEdgeHover={this.handleEdgeHover}
                  hoveredNode={this.state.hoveredNode as string | null}
                  hoveredEdge={this.state.hoveredEdge as string | null}
                />
              </SigmaContainer>
            </React.Suspense>
          </div>
          {this.renderDetailsPanel()}
        </div>
        {this.renderSidePanel()}
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
