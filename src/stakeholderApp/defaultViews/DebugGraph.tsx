import React, { useState, useEffect, useCallback } from 'react';
import { BaseChart } from './BaseChart';
import { NodeDetailsModal } from './stakeholder/NodeDetailsModal';

import { Palette } from '../../colors';
import type { VizConfig, VizComponentProps, GraphData, Edge } from 'grafeovidajo';
import type { Node } from 'typescript';

export interface DebugConfig extends VizConfig {
  showNodeIds?: boolean;
  showEdgeLabels?: boolean;
  showAttributes?: boolean;
  nodeSpacing?: number;
  maxLabelLength?: number;
  viewMode?: 'svg' | 'html' | 'both'; // Add view mode option
  forceLayout?: {
    strength?: number;
    distance?: number;
    iterations?: number;
  };
}

export const DebugGraph: React.FC<VizComponentProps & { config: DebugConfig }> = (props) => {
  const [viewMode, setViewMode] = useState<'svg' | 'html' | 'both'>(props.config.viewMode || 'both');
  const [useForceLayout, setUseForceLayout] = useState<boolean>(
    props.config.projection?.layout === 'force' || false
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for filtering nodes and edges by type
  const [nodeTypeFilters, setNodeTypeFilters] = useState<Record<string, boolean>>({});
  const [edgeTypeFilters, setEdgeTypeFilters] = useState<Record<string, boolean>>({});

  // Initialize filters based on current data
  useEffect(() => {
    const newNodeFilters: Record<string, boolean> = {};
    const newEdgeFilters: Record<string, boolean> = {};

    // Collect all node types
    props.data.nodes.forEach(node => {
      const type = node.type || 'unknown';
      if (!(type in newNodeFilters)) {
        newNodeFilters[type] = true; // Default to visible
      }
    });

    // Collect all edge types
    props.data.edges?.forEach(edge => {
      const type = edge.attributes?.type || 'unknown';
      if (!(type in newEdgeFilters)) {
        newEdgeFilters[type] = true; // Default to visible
      }
    });

    setNodeTypeFilters(prev => ({ ...newNodeFilters, ...prev }));
    setEdgeTypeFilters(prev => ({ ...newEdgeFilters, ...prev }));
  }, [props.data.nodes, props.data.edges]);

  // Handle node type filter toggle
  const toggleNodeTypeFilter = useCallback((type: string) => {
    setNodeTypeFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);

  // Handle edge type filter toggle
  const toggleEdgeTypeFilter = useCallback((type: string) => {
    setEdgeTypeFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);

  // Filter nodes and edges based on current filters
  const filteredNodes = props.data.nodes.filter(node => {
    const type = node.type || 'unknown';
    return nodeTypeFilters[type] !== false; // Show if true or undefined
  });

  const filteredEdges = props.data.edges?.filter(edge => {
    const type = edge.attributes?.type || 'unknown';
    return edgeTypeFilters[type] !== false; // Show if true or undefined
  });

  // Handle wheel event to prevent propagation
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  // Create a simple projection for debugging
  const debugConfig: VizConfig = {
    ...props.config,
    projection: {
      xAttribute: props.config.projection.xAttribute || 'id',
      yAttribute: props.config.projection.yAttribute || 'type',
      xType: props.config.projection.xType || 'categorical',
      yType: props.config.projection.yType || 'categorical',
      layout: props.config.projection.layout || 'grid',
      spacing: props.config.projection.spacing || { x: 100, y: 100 }
    },
    style: {
      ...props.config.style,
      nodeSize: props.config.style?.nodeSize || 15,
      nodeColor: props.config.style?.nodeColor || (node => {
        // Color nodes by type for easy identification
        const type = node.type || 'unknown';

        // For test_result nodes, color based on result
        if (type === 'test_result') {
          const metadata = node.attributes?.metadata || {};
          const result = metadata.result;

          // Determine color based on result
          if (result === 0 || result === false) {
            return Palette.bluishGreen; // Success
          } else if (result > 0) {
            return Palette.amberGold; // Warning
          } else if (result < 0 || result === true) {
            return Palette.deepOrange; // Error
          }
          // Default for test_result
          return Palette.deepOrange;
        }

        // For test nodes, check if they have a failed status
        if (type === 'test') {
          const metadata = node.attributes?.metadata || {};
          const failed = metadata.failed;

          if (failed === false) {
            return Palette.bluishGreen; // Success
          } else if (failed === true) {
            return Palette.deepOrange; // Error
          }
        }

        // For other node types, use the default mapping
        const typeColors: Record<string, string> = {
          'feature': Palette.bluishGreen,      // Green
          'entrypoint': Palette.rust,          // Purple
          'test': Palette.amberGold,           // Orange
          'test_result': Palette.deepOrange,   // Red
          'file': Palette.warmGrey,            // Grey
          'documentation': Palette.oliveDark,  // Dark Green
          'config': Palette.charcoal,          // Charcoal
          'attribute': Palette.amberGold,      // Amber for attribute nodes
          'folder': Palette.oliveDark,         // Dark Green for folders
          'url-folder': Palette.amberGold,     // Orange for URL folders (virtual)
          'domain': Palette.rust,              // Purple for domain nodes
          'aider': Palette.rust,               // Purple for aider nodes
          'aider_process': Palette.rust,       // Purple for aider process nodes
          'docker_process': Palette.warmGrey,  // Grey for docker process nodes
          'bdd_process': Palette.amberGold,    // Orange for BDD process nodes
          'check_process': Palette.amberGold,  // Orange for check process nodes
          'builder_process': Palette.charcoal, // Charcoal for builder process nodes
          'unknown': Palette.charcoal          // Grey
        };
        return typeColors[type] || typeColors.unknown;
      }),
      nodeShape: props.config.style?.nodeShape || 'circle',
      labels: {
        show: true,
        attribute: 'label',
        fontSize: 12
      },
      edgeColor: '#999',
      edgeWidth: 2
    }
  };

  // Update layout based on state
  if (useForceLayout) {
    debugConfig.projection.layout = 'force';
    // Add force-specific settings if provided
    if (props.config.forceLayout) {
      debugConfig.projection = {
        ...debugConfig.projection,
        ...props.config.forceLayout
      };
    }
  } else {
    debugConfig.projection.layout = 'grid';
  }

  // Add debug information to nodes
  const debugData: GraphData = {
    ...props.data,
    nodes: filteredNodes.map(node => {
      // Check if this looks like an attribute node
      const id = node.id;
      const parts = id.split(':');
      const lastPart = parts[parts.length - 1];
      const attributeNames = [
        'testName', 'configKey', 'result', 'content', 'filePath', 'relativePath'
      ];
      const isAttributeNode = node.type === 'attribute' || attributeNames.includes(lastPart);

      return {
        ...node,
        attributes: {
          ...node.attributes,
          // Add debug info to label
          debugLabel: props.config.showNodeIds ? `${node.id}` : node.attributes?.label || node.id,
          // Add type to label if showing attributes
          debugType: props.config.showAttributes ? `[${node.attributes?.type || 'unknown'}]` : '',
          // Mark if this is an attribute node
          isAttributeNode: isAttributeNode
        }
      };
    }),
    edges: filteredEdges
  };

  // Handle node click to open modal
  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    setIsModalOpen(true);
    // Also call the original onNodeClick if provided
    props.onNodeClick?.(node);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedNode(null);
  };

  // Render HTML/markup view
  const renderHtmlView = () => {
    const nodes = filteredNodes;
    const edges = filteredEdges;

    return (
      <div style={{
        display: 'flex',
        gap: '20px',
        height: '100%',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        {/* Nodes list */}
        <div style={{
          flex: 1,
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '10px',
          overflow: 'auto'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Nodes ({nodes.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {nodes.map((node: Node) => (
              <div
                key={node.id}
                style={{
                  padding: '8px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '3px',
                  backgroundColor: '#f9f9f9',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={() => props.onNodeHover?.(node)}
                onMouseLeave={() => props.onNodeHover?.(null)}
                onClick={() => handleNodeClick(node)}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {(node.icon || node.attributes?.icon) && (
                    <span style={{ fontSize: '14px' }}>
                      {(() => {
                        const icon = node.icon || node.attributes?.icon;
                        if (icon === 'document') return '📄';
                        if (icon === 'folder') return '📁';
                        if (icon === 'globe') return '🌐';
                        if (icon === 'file-text') return '📝';
                        if (icon === 'test') return '🧪';
                        if (icon === 'circle') return '⭕';
                        if (icon === 'play') return '▶️';
                        if (icon === 'check') return '✅';
                        if (icon === 'aider') return '🤖';
                        return '❓';
                      })()}
                    </span>
                  )}
                  {node.id}
                  {node.attributes?.isAttributeNode && (
                    <span style={{
                      marginLeft: '5px',
                      fontSize: '10px',
                      color: '#999',
                      fontStyle: 'italic'
                    }}>
                      (attribute)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  Type: <span style={{ color: '#007acc' }}>{node.type || 'unknown'}</span>
                </div>
                {(node.icon || node.attributes?.icon) && (
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Icon: {node.icon || node.attributes?.icon}
                  </div>
                )}
                {node.label && (
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Label: {node.label}
                  </div>
                )}
                {node.metadata?.frontmatter?.status && (
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Status: <span style={{
                      color: node.metadata.frontmatter.status === 'done' ? '#4CAF50' :
                        node.metadata.frontmatter.status === 'doing' ? '#FF9800' :
                          node.metadata.frontmatter.status === 'blocked' ? '#F44336' : '#666'
                    }}>
                      {node.metadata.frontmatter.status}
                    </span>
                  </div>
                )}
                {node.metadata?.frontmatter?.priority && (
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Priority: {node.metadata.frontmatter.priority}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Edges list */}
        <div style={{
          flex: 1,
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '10px',
          overflow: 'auto'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Edges ({edges?.length || 0})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {edges && edges.length > 0 ? (
              edges.map((edge: Edge, index: number) => (
                <div
                  key={`${edge.source}-${edge.target}-${index}`}
                  style={{
                    padding: '8px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '3px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
                    {edge.source} → {edge.target}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Type: <span style={{ color: '#007acc' }}>{edge.attributes?.type || 'unknown'}</span>
                  </div>
                  {/* {edge.attributes?.weight && (
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      Weight: {edge.attributes.weight}
                    </div>
                  )} */}
                  {edge.attributes?.timestamp && (
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      Timestamp: {new Date(edge.attributes.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '10px', textAlign: 'center', color: '#999' }}>
                No edges in graph
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render SVG view
  const renderSvgView = () => {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '600px' // Make visualization bigger
        }}
        onWheel={handleWheel}
      >
        <BaseChart
          {...props}
          data={debugData}
          config={debugConfig}
          onNodeClick={handleNodeClick}
          onNodeUpdate={props.onNodeUpdate}
        />

        {/* Debug overlay with statistics */}
        <div style={{
          position: 'absolute',
          top: 50,
          left: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace',
          border: '1px solid #ccc',
          maxWidth: '300px',
          zIndex: 10,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>Graph Debug Info</div>
          <div>Nodes: {filteredNodes.length}/{props.data.nodes.length}</div>
          <div>Edges: {filteredEdges?.length || 0}/{props.data.edges?.length || 0}</div>
          <div style={{ marginTop: '5px', fontWeight: 'bold' }}>Node Types:</div>
          {(() => {
            const typeCounts: Record<string, number> = {};
            filteredNodes.forEach(node => {
              const type = node.type || 'unknown';
              typeCounts[type] = (typeCounts[type] || 0) + 1;
            });
            return Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} style={{ marginLeft: '10px' }}>
                {type}: {count}
              </div>
            ));
          })()}
          <div style={{ marginTop: '5px', fontWeight: 'bold' }}>Edge Types:</div>
          {(() => {
            const edgeTypeCounts: Record<string, number> = {};
            filteredEdges?.forEach(edge => {
              const type = edge.attributes?.type || 'unknown';
              edgeTypeCounts[type] = (edgeTypeCounts[type] || 0) + 1;
            });
            return Object.entries(edgeTypeCounts).map(([type, count]) => (
              <div key={type} style={{ marginLeft: '10px' }}>
                {type}: {count}
              </div>
            ));
          })()}
        </div>
      </div>
    );
  };

  // Render legend with checkboxes for filtering
  const renderLegend = () => {
    const nodeTypes = Object.keys(nodeTypeFilters);
    const edgeTypes = Object.keys(edgeTypeFilters);

    return (
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        border: '1px solid #ccc',
        zIndex: 10,
        maxWidth: '250px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>
          Filter by Type
        </div>

        {/* Node types */}
        {nodeTypes.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#007acc' }}>
              Node Types ({filteredNodes.length}/{props.data.nodes.length})
            </div>
            {nodeTypes.map(type => (
              <div key={`node-${type}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
                <input
                  type="checkbox"
                  id={`node-${type}`}
                  checked={nodeTypeFilters[type] !== false}
                  onChange={() => toggleNodeTypeFilter(type)}
                  style={{ marginRight: '6px', cursor: 'pointer' }}
                />
                <label
                  htmlFor={`node-${type}`}
                  style={{
                    cursor: 'pointer',
                    color: nodeTypeFilters[type] !== false ? '#000' : '#999'
                  }}
                >
                  {type} ({props.data.nodes.filter(n => (n.type || 'unknown') === type).length})
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Edge types */}
        {edgeTypes.length > 0 && (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#4CAF50' }}>
              Edge Types ({filteredEdges?.length || 0}/{props.data.edges?.length || 0})
            </div>
            {edgeTypes.map(type => (
              <div key={`edge-${type}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
                <input
                  type="checkbox"
                  id={`edge-${type}`}
                  checked={edgeTypeFilters[type] !== false}
                  onChange={() => toggleEdgeTypeFilter(type)}
                  style={{ marginRight: '6px', cursor: 'pointer' }}
                />
                <label
                  htmlFor={`edge-${type}`}
                  style={{
                    cursor: 'pointer',
                    color: edgeTypeFilters[type] !== false ? '#000' : '#999'
                  }}
                >
                  {type} ({props.data.edges?.filter(e => (e.attributes?.type || 'unknown') === type).length || 0})
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render view mode selector
  const renderViewModeSelector = () => {
    return (
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '8px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        border: '1px solid #ccc',
        zIndex: 10,
        display: 'flex',
        gap: '5px',
        flexWrap: 'wrap',
        maxWidth: '300px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setViewMode('svg')}
            style={{
              padding: '4px 8px',
              backgroundColor: viewMode === 'svg' ? '#007acc' : '#f0f0f0',
              color: viewMode === 'svg' ? 'white' : '#333',
              border: '1px solid #ccc',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            SVG
          </button>
          <button
            onClick={() => setViewMode('html')}
            style={{
              padding: '4px 8px',
              backgroundColor: viewMode === 'html' ? '#007acc' : '#f0f0f0',
              color: viewMode === 'html' ? 'white' : '#333',
              border: '1px solid #ccc',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            HTML
          </button>
          <button
            onClick={() => setViewMode('both')}
            style={{
              padding: '4px 8px',
              backgroundColor: viewMode === 'both' ? '#007acc' : '#f0f0f0',
              color: viewMode === 'both' ? 'white' : '#333',
              border: '1px solid #ccc',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Both
          </button>
        </div>
        <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
          <button
            onClick={() => setUseForceLayout(!useForceLayout)}
            style={{
              padding: '4px 8px',
              backgroundColor: useForceLayout ? '#4CAF50' : '#f0f0f0',
              color: useForceLayout ? 'white' : '#333',
              border: '1px solid #ccc',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            {useForceLayout ? 'Force Layout' : 'Grid Layout'}
          </button>
        </div>
      </div>
    );
  };

  // Render based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'svg':
        return renderSvgView();
      case 'html':
        return renderHtmlView();
      case 'both':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
            <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
              {renderSvgView()}
            </div>
            <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
              {renderHtmlView()}
            </div>
          </div>
        );
      default:
        return renderSvgView();
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '800px' // Make the whole component bigger
      }}
      onWheel={handleWheel}
    >
      {renderViewModeSelector()}
      {renderLegend()}
      {renderContent()}
      <NodeDetailsModal
        node={selectedNode}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};
