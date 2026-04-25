import React from 'react';
import type { GraphData } from '../../../graph';

interface DebugGraphSidePanelProps {
  data: GraphData | null;
  onNodeClick?: (node: any) => void;
  onEdgeClick?: (edge: any) => void;
}

export const DebugGraphSidePanel: React.FC<DebugGraphSidePanelProps> = ({
  data,
  onNodeClick,
  onEdgeClick
}) => {
  if (!data) return null;

  const nodes = data.nodes || [];
  const edges = data.edges || [];

  return (
    <>
      {/* Column 1: Nodes list */}
      <div style={{
        flex: 1,
        minWidth: '150px',
        maxWidth: '25%',
        borderRight: '1px solid #ccc',
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
                onNodeClick?.({ id: node.id, ...node });
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
      </div>

      {/* Column 2: Edges list */}
      <div style={{
        flex: 1,
        minWidth: '150px',
        maxWidth: '25%',
        borderRight: '1px solid #ccc',
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
                onEdgeClick?.({ id: `edge-${idx}`, ...edge });
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
    </>
  );
};
