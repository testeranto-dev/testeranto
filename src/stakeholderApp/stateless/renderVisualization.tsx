import React, { useState } from "react";
import { type GraphData, type Node, EisenhowerMatrix, GanttChart, KanbanBoard, TreeGraph } from "../../grafeovidajo/index";
import { getNodeStatus } from "../../grafeovidajo/charts/KanbanBoard";

interface HtmlTreeProps {
  data: GraphData;
  onNodeClick?: (node: Node) => void;
  onNodeHover?: (node: Node | null) => void;
}

interface TreeViewWithSwitcherProps {
  data: GraphData;
  onNodeClick?: (node: Node) => void;
  onNodeHover?: (node: Node | null) => void;
}

const TreeViewWithSwitcher: React.FC<TreeViewWithSwitcherProps> = ({ data, onNodeClick, onNodeHover }) => {
  const [viewMode, setViewMode] = useState<'html' | 'svg'>('html');

  const renderHtmlTree = () => (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '20px',
      maxHeight: '500px',
      overflow: 'auto'
    }}>
      <HtmlTree
        data={data}
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}
      />
    </div>
  );

  const renderSvgTree = () => {
    // Configure tree layout for SVG
    const treeConfig = {
      projection: {
        layout: 'tree' as const,
        xAttribute: 'type',
        yAttribute: 'label',
        xType: 'categorical' as const,
        yType: 'categorical' as const,
        spacing: { x: 150, y: 100 }
      },
      style: {
        nodeSize: (node: any) => {
          const type = node.attributes?.type || 'unknown';
          if (type === 'folder' || type === 'directory') return 15;
          if (type === 'file') return 10;
          if (type === 'feature') return 12;
          if (type === 'test') return 11;
          return 8;
        },
        nodeColor: (node: any) => {
          const type = node.attributes?.type || 'unknown';
          const typeColors: Record<string, string> = {
            'feature': '#4caf50',
            'file': '#2196f3',
            'folder': '#007acc',
            'directory': '#007acc',
            'test': '#ff9800',
            'test_result': '#f44336',
            'documentation': '#9c27b0',
            'config': '#795548',
            'unknown': '#9e9e9e'
          };
          return typeColors[type] || typeColors.unknown;
        },
        nodeShape: (node: any) => {
          const type = node.attributes?.type || 'unknown';
          if (type === 'folder' || type === 'directory') return 'square';
          return 'circle';
        },
        labels: {
          show: true,
          attribute: 'label',
          fontSize: 12
        },
        edgeColor: '#999',
        edgeWidth: 2
      }
    };

    return (
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '20px',
        height: '500px',
        overflow: 'hidden'
      }}>
        <TreeGraph
          data={data}
          config={treeConfig}
          width={800}
          height={450}
          onNodeClick={onNodeClick || (() => { })}
          onNodeHover={onNodeHover || (() => { })}
        />
      </div>
    );
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div>
          <h3 style={{ margin: 0 }}>Unified Tree View</h3>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Combined view of features, files, and their relationships
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: '10px',
          backgroundColor: '#f5f5f5',
          padding: '5px',
          borderRadius: '6px'
        }}>
          <button
            onClick={() => setViewMode('html')}
            style={{
              padding: '8px 16px',
              backgroundColor: viewMode === 'html' ? '#007acc' : 'transparent',
              color: viewMode === 'html' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: viewMode === 'html' ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            HTML List
          </button>
          <button
            onClick={() => setViewMode('svg')}
            style={{
              padding: '8px 16px',
              backgroundColor: viewMode === 'svg' ? '#007acc' : 'transparent',
              color: viewMode === 'svg' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: viewMode === 'svg' ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            SVG Tree
          </button>
        </div>
      </div>

      {viewMode === 'html' ? renderHtmlTree() : renderSvgTree()}

      <div style={{
        marginTop: '10px',
        fontSize: '0.9em',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          Total nodes: {data.nodes.length} | Total edges: {data.edges?.length || 0}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#4caf50'
            }}></span>
            Feature
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#2196f3'
            }}></span>
            File
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '4px',
              backgroundColor: '#007acc'
            }}></span>
            Folder
          </span>
        </div>
      </div>
    </div>
  );
};


const HtmlTree: React.FC<HtmlTreeProps> = ({ data, onNodeClick, onNodeHover }) => {
  // Build adjacency lists
  const incomingEdges = new Map<string, string[]>();
  const outgoingEdges = new Map<string, string[]>();

  // Initialize maps
  data.nodes.forEach(node => {
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
  });

  // Populate edges
  data.edges?.forEach(edge => {
    // Add to incoming edges of target
    const targetIncoming = incomingEdges.get(edge.target) || [];
    if (!targetIncoming.includes(edge.source)) {
      targetIncoming.push(edge.source);
    }
    incomingEdges.set(edge.target, targetIncoming);

    // Add to outgoing edges of source
    const sourceOutgoing = outgoingEdges.get(edge.source) || [];
    if (!sourceOutgoing.includes(edge.target)) {
      sourceOutgoing.push(edge.target);
    }
    outgoingEdges.set(edge.source, sourceOutgoing);
  });

  // Find root nodes (nodes with no incoming edges)
  const rootNodes = data.nodes.filter(node => {
    const incoming = incomingEdges.get(node.id) || [];
    return incoming.length === 0;
  });

  // If no root nodes found, use all nodes as roots
  const displayNodes = rootNodes.length > 0 ? rootNodes : data.nodes;

  // Track visited nodes to prevent cycles
  const visited = new Set<string>();

  // Recursive function to render a node and its children
  const renderNode = (node: Node, depth: number = 0): React.ReactElement => {
    if (visited.has(node.id)) {
      return (
        <li key={node.id} style={{ marginBottom: '5px', color: '#999' }}>
          <div style={{ marginLeft: `${depth * 20}px` }}>
            ⚠️ Cycle detected: {node.attributes?.label || node.id}
          </div>
        </li>
      );
    }

    visited.add(node.id);

    const nodeType = node.attributes?.type || 'unknown';
    const label = node.attributes?.label || node.id;

    // Get children from outgoing edges
    const childrenIds = outgoingEdges.get(node.id) || [];
    const children = data.nodes.filter(n => childrenIds.includes(n.id));

    // Determine icon based on node type
    let icon = '📄';
    switch (nodeType) {
      case 'folder':
      case 'directory':
        icon = '📁';
        break;
      case 'feature':
        icon = '⭐';
        break;
      case 'test':
        icon = '🧪';
        break;
      case 'test_result':
        icon = '📊';
        break;
      case 'file':
        icon = '📄';
        break;
      case 'documentation':
        icon = '📚';
        break;
      case 'config':
        icon = '⚙️';
        break;
      default:
        icon = '📄';
    }

    // Determine color based on node type
    let color = '#333';
    switch (nodeType) {
      case 'feature':
        color = '#4caf50';
        break;
      case 'file':
        color = '#2196f3';
        break;
      case 'folder':
      case 'directory':
        color = '#007acc';
        break;
      case 'test':
        color = '#ff9800';
        break;
      case 'test_result':
        color = '#f44336';
        break;
      case 'documentation':
        color = '#9c27b0';
        break;
      case 'config':
        color = '#795548';
        break;
    }

    const result = (
      <li key={node.id} style={{ marginBottom: '5px' }}>
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: children.length > 0 ? '#f8f9fa' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            marginLeft: `${depth * 20}px`,
            borderLeft: `4px solid ${color}`,
            transition: 'background-color 0.2s',
            ':hover': {
              backgroundColor: '#e9ecef'
            }
          }}
          onClick={() => onNodeClick?.(node)}
          onMouseEnter={() => onNodeHover?.(node)}
          onMouseLeave={() => onNodeHover?.(null)}
        >
          <span style={{ marginRight: '10px', fontSize: '1.1em' }}>{icon}</span>
          <span style={{
            fontWeight: children.length > 0 ? '600' : 'normal',
            flex: 1
          }}>
            {label}
          </span>
          <span style={{
            fontSize: '0.75em',
            color: '#6c757d',
            backgroundColor: '#e9ecef',
            padding: '2px 8px',
            borderRadius: '12px',
            marginLeft: '10px'
          }}>
            {nodeType}
          </span>
        </div>
        {children.length > 0 && (
          <ul style={{
            listStyleType: 'none',
            paddingLeft: '24px',
            marginTop: '8px',
            borderLeft: '2px dashed #dee2e6'
          }}>
            {children.map(child => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );

    visited.delete(node.id);
    return result;
  };

  return (
    <div>
      <div style={{
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#e9ecef',
        borderRadius: '4px',
        fontSize: '0.9em'
      }}>
        Total nodes: {data.nodes.length} | Total edges: {data.edges?.length || 0} |
        Root nodes: {displayNodes.length}
      </div>
      <ul style={{
        listStyleType: 'none',
        paddingLeft: '0',
        margin: '0'
      }}>
        {displayNodes.map(node => renderNode(node))}
      </ul>
    </div>
  );
};

export interface RenderVisualizationProps {
  data: {
    unifiedGraph?: GraphData;
    vizConfig?: any;
  };
  vizType: 'eisenhower' | 'gantt' | 'kanban' | 'tree';
  onNodeClick?: (node: Node) => void;
  onNodeHover?: (node: Node | null) => void;
  onNodeUpdate?: (nodeId: string, updatedAttributes: Record<string, any>) => void;
}

export function renderVisualization({
  data,
  vizType,
  onNodeClick,
  onNodeHover,
  onNodeUpdate
}: RenderVisualizationProps): React.ReactElement {
  // Always use unifiedGraph
  const graphToUse = data.unifiedGraph;

  if (!graphToUse || !graphToUse.nodes || graphToUse.nodes.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>No Graph Data Available</h3>
        <p>Features need to be extracted from test results to create visualizations.</p>
        <p>Run tests to generate feature data.</p>
      </div>
    );
  }

  const graphData: GraphData = {
    nodes: graphToUse.nodes,
    edges: graphToUse.edges || []
  };

  const baseConfig = data.vizConfig || {
    projection: {
      xAttribute: 'status',
      yAttribute: 'points',
      xType: 'categorical',
      yType: 'continuous',
      layout: 'grid'
    },
    style: {
      nodeSize: (node: any) => {
        if (node.attributes.points) return Math.max(10, node.attributes.points * 5);
        return 10;
      },
      nodeColor: (node: any) => {
        const status = node.attributes.status;
        if (status === 'done') return '#4caf50';
        if (status === 'doing') return '#ff9800';
        if (status === 'todo') return '#f44336';
        return '#9e9e9e';
      },
      nodeShape: 'circle',
      labels: {
        show: true,
        attribute: 'name',
        fontSize: 12
      }
    }
  };

  const commonProps = {
    data: graphData,
    width: 800,
    height: 500,
    onNodeClick: onNodeClick || (() => { }),
    onNodeHover: onNodeHover || (() => { }),
    onNodeUpdate: onNodeUpdate
  };

  switch (vizType) {
    case 'eisenhower':
      return (
        <div>
          <h3>Eisenhower Matrix</h3>
          <p>Urgency vs Importance of features</p>
          <EisenhowerMatrix
            {...commonProps}
            config={{
              ...baseConfig,
              projection: {
                ...baseConfig.projection,
                xAttribute: 'urgency',
                yAttribute: 'importance',
                xType: 'continuous',
                yType: 'continuous'
              },
              quadrants: {
                urgentImportant: { x: [0, 0.5], y: [0, 0.5] },
                notUrgentImportant: { x: [0.5, 1], y: [0, 0.5] },
                urgentNotImportant: { x: [0, 0.5], y: [0.5, 1] },
                notUrgentNotImportant: { x: [0.5, 1], y: [0.5, 1] }
              }
            }}
          />
        </div>
      );
    case 'gantt':
      return (
        <div>
          <h3>Gantt Chart</h3>
          <p>Feature timeline</p>
          <GanttChart
            {...commonProps}
            config={{
              ...baseConfig,
              timeRange: [new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)],
              rowHeight: 30,
              showDependencies: true
            }}
          />
        </div>
      );
    case 'kanban':
      return (
        <div>
          <h3>Kanban Board</h3>
          <p>Feature status columns (including backlog for tickets without a status)</p>
          <KanbanBoard
            {...commonProps}
            config={{
              ...baseConfig,
              columns: [
                {
                  id: 'todo',
                  title: 'To Do',
                  statusFilter: (node: Node) => {
                    const status = getNodeStatus(node);
                    return status === 'todo';
                  },
                  width: 20,
                  targetStatus: 'todo'
                },
                {
                  id: 'doing',
                  title: 'Doing',
                  statusFilter: (node: Node) => {
                    const status = getNodeStatus(node);
                    return status === 'doing';
                  },
                  width: 20,
                  targetStatus: 'doing'
                },
                {
                  id: 'review',
                  title: 'Review',
                  statusFilter: (node: Node) => {
                    const status = getNodeStatus(node);
                    return status === 'review';
                  },
                  width: 20,
                  targetStatus: 'review'
                },
                {
                  id: 'done',
                  title: 'Done',
                  statusFilter: (node: Node) => {
                    const status = getNodeStatus(node);
                    return status === 'done';
                  },
                  width: 20,
                  targetStatus: 'done'
                }
              ]
            }}
          />
        </div>
      );
    case 'tree':
      return (
        <TreeViewWithSwitcher
          data={graphData}
          onNodeClick={onNodeClick}
          onNodeHover={onNodeHover}
        />
      );
    default:
      return <div>Select a visualization type</div>;
  }
}
