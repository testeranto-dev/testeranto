import React from 'react';
import type { SelectedElement } from './DebugGraphUtils';

interface DebugGraphInspectorProps {
  selectedElement: SelectedElement | null;
}

export const DebugGraphInspector: React.FC<DebugGraphInspectorProps> = ({
  selectedElement
}) => {
  if (!selectedElement) {
    return (
      <div style={{
        padding: '8px',
        color: '#666',
        fontSize: '11px'
      }}>
        Click a node or edge to inspect its details.
      </div>
    );
  }

  const data = selectedElement.data;
  const entries = Object.entries(data).filter(([key]) => key !== 'nodeData' && key !== 'edgeData' && key !== 'originalColor' && key !== 'originalSize');

  return (
    <div>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333', fontSize: '12px' }}>
        {selectedElement.type === 'node' ? 'Node' : 'Edge'}: {selectedElement.id}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '4px 8px', fontWeight: 600, color: '#555', width: '80px', verticalAlign: 'top', fontSize: '11px' }}>
                {key}
              </td>
              <td style={{ padding: '4px 8px', color: '#333', wordBreak: 'break-all', fontSize: '11px' }}>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
