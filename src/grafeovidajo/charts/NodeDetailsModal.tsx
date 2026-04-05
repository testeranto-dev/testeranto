import React from 'react';
import { Node } from '../core/types';
import { Palette } from '../../colors';

export interface NodeDetailsModalProps {
  node: Node | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NodeDetailsModal: React.FC<NodeDetailsModalProps> = ({ node, isOpen, onClose }) => {
  if (!isOpen || !node) return null;

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Format attributes for display
  const formatAttributes = (attributes: Record<string, any>): Array<{ key: string; value: any }> => {
    const result: Array<{ key: string; value: any }> = [];

    for (const [key, value] of Object.entries(attributes)) {
      // Skip internal or debug attributes
      if (key.startsWith('_') || key === 'debugLabel' || key === 'debugType' || key === 'isAttributeNode') {
        continue;
      }

      // Format the value for display
      let displayValue = value;
      if (value === null || value === undefined) {
        displayValue = 'null';
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
      } else if (typeof value === 'boolean') {
        displayValue = value.toString();
      }

      result.push({ key, value: displayValue });
    }

    return result.sort((a, b) => a.key.localeCompare(b.key));
  };

  const attributes = node.attributes ? formatAttributes(node.attributes) : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleBackgroundClick}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          maxHeight: '80vh',
          width: '90%',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: Palette.rust }}>Node Details</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: Palette.charcoal }}>ID:</strong>
            <div style={{
              fontFamily: 'monospace',
              backgroundColor: '#f5f5f5',
              padding: '8px',
              borderRadius: '4px',
              marginTop: '4px',
              wordBreak: 'break-all'
            }}>
              {node.id}
            </div>
          </div>

          {node.attributes?.type && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: Palette.charcoal }}>Type:</strong>
              <div style={{
                display: 'inline-block',
                backgroundColor: Palette.rustSubtle,
                color: Palette.rust,
                padding: '4px 8px',
                borderRadius: '4px',
                marginLeft: '8px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {node.attributes.type}
              </div>
            </div>
          )}

          {node.attributes?.label && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: Palette.charcoal }}>Label:</strong>
              <div style={{
                padding: '8px',
                marginTop: '4px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px'
              }}>
                {node.attributes.label}
              </div>
            </div>
          )}
        </div>

        {attributes.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '12px', color: Palette.charcoal }}>Attributes</h3>
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              {attributes.map((attr) => (
                <div
                  key={attr.key}
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid #e0e0e0',
                    padding: '12px',
                    backgroundColor: '#fff',
                  }}
                >
                  <div style={{
                    flex: '0 0 150px',
                    fontWeight: 'bold',
                    color: Palette.rust
                  }}>
                    {attr.key}
                  </div>
                  <div style={{
                    flex: 1,
                    fontFamily: typeof attr.value === 'string' && attr.value.includes('{') ? 'monospace' : 'inherit',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {attr.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: Palette.rust,
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = Palette.rustDark}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = Palette.rust}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
