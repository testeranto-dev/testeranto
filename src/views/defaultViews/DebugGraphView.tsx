import React, { useEffect, useRef, useState } from 'react';
import type { GraphData } from '../../graph';
import { BaseViewClass } from '../BaseViewClass';

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
    const config = this.config;

    if (!data) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>No graph data available</div>
        </div>
      );
    }

    // Check if Sigma.js is available
    const [sigmaAvailable, setSigmaAvailable] = useState(false);
    const [sigmaError, setSigmaError] = useState<string | null>(null);

    useEffect(() => {
      // Try to dynamically import Sigma.js
      import('@react-sigma/core').then(() => {
        setSigmaAvailable(true);
      }).catch((error) => {
        console.warn('Sigma.js not available:', error);
        setSigmaError('Sigma.js is not installed. Please install @react-sigma/core, graphology, and lodash.');
      });
    }, []);

    if (!sigmaAvailable) {
      return (
        <div style={{ 
          width: '100%', 
          height: '100%',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}>
          <h3>Sigma.js Graph Viewer</h3>
          <div style={{ 
            marginTop: '20px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            maxWidth: '600px'
          }}>
            <p><strong>Sigma.js is not available.</strong></p>
            <p>To use the interactive graph viewer, install the required dependencies:</p>
            <pre style={{ 
              backgroundColor: '#f0f0f0',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              margin: '10px 0'
            }}>
              yarn add @react-sigma/core graphology lodash
            </pre>
            <p>Or using npm:</p>
            <pre style={{ 
              backgroundColor: '#f0f0f0',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              margin: '10px 0'
            }}>
              npm install @react-sigma/core graphology lodash
            </pre>
            {sigmaError && (
              <p style={{ color: '#d32f2f' }}>Error: {sigmaError}</p>
            )}
            <div style={{ marginTop: '20px' }}>
              <h4>Graph Data Summary:</h4>
              <p>Nodes: {data.nodes.length}</p>
              <p>Edges: {data.edges?.length || 0}</p>
              <p>Without Sigma.js, showing a simple table view:</p>
              <div style={{ 
                maxHeight: '300px',
                overflow: 'auto',
                marginTop: '10px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e0e0e0' }}>
                      <th style={{ padding: '8px', border: '1px solid #ccc' }}>ID</th>
                      <th style={{ padding: '8px', border: '1px solid #ccc' }}>Label</th>
                      <th style={{ padding: '8px', border: '1px solid #ccc' }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.nodes.slice(0, 20).map((node, index) => (
                      <tr 
                        key={node.id}
                        style={{ 
                          backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                          cursor: 'pointer'
                        }}
                        onClick={() => (this.props as any).onNodeClick?.(node)}
                        onMouseEnter={() => (this.props as any).onNodeHover?.(node)}
                        onMouseLeave={() => (this.props as any).onNodeHover?.(null)}
                      >
                        <td style={{ padding: '8px', border: '1px solid #ccc', fontFamily: 'monospace' }}>
                          {node.id}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                          {node.label || 'N/A'}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                          {typeof node.type === 'object' ? 
                            `${node.type.category}/${node.type.type}` : 
                            String(node.type)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.nodes.length > 20 && (
                  <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
                    Showing first 20 of {data.nodes.length} nodes
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Dynamically import Sigma.js components when available
    const SigmaComponent = React.lazy(() => 
      import('./SigmaDebugGraph').then(module => ({ default: module.SigmaDebugGraph }))
    );

    return (
      <div style={{ 
        width: '100%', 
        height: '100%',
        border: '1px solid #ccc',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
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
          <SigmaComponent 
            data={data}
            config={config}
            width={width}
            height={height}
            onNodeClick={(this.props as any).onNodeClick}
            onNodeHover={(this.props as any).onNodeHover}
          />
        </React.Suspense>
      </div>
    );
  }
}

// Wrapper component for backward compatibility
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

// Default export for the view
export default DebugGraphView;
