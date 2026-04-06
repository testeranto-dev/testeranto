import React, { useState } from 'react';
import { BaseChart } from './BaseChart';
import { NodeDetailsModal } from './NodeDetailsModal';
import { VizConfig, GraphData, Node, Edge, VizComponentProps } from '../core/types';
import { Palette } from '../../colors';

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
    nodes: props.data.nodes.map(node => {
      // Check if this looks like an attribute node
      const id = node.id;
      const parts = id.split(':');
      const lastPart = parts[parts.length - 1];
      const attributeNames = [

        // 'isJson', 'size', 'modified', 

        'testName', 'configKey', 'result', 'content', 'filePath', 'relativePath'];
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
    })
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
    const { nodes, edges } = props.data;

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
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace',
          border: '1px solid #ccc',
          maxWidth: '300px',
          zIndex: 10
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Graph Debug Info</div>
          <div>Nodes: {props.data.nodes.length}</div>
          <div>Edges: {props.data.edges?.length || 0}</div>
          <div style={{ marginTop: '5px', fontWeight: 'bold' }}>Node Types:</div>
          {(() => {
            const typeCounts: Record<string, number> = {};
            props.data.nodes.forEach(node => {
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
            props.data.edges?.forEach(edge => {
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

  // Render view mode selector
  const renderViewModeSelector = () => {
    return (
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '8px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        border: '1px solid #ccc',
        zIndex: 10,
        display: 'flex',
        gap: '5px',
        flexWrap: 'wrap',
        maxWidth: '300px'
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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {renderViewModeSelector()}
      {renderContent()}
      <NodeDetailsModal
        node={selectedNode}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};
