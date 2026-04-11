// DO NOT PUT THE SLICER FUNCTION IN THIS FILE
import React from 'react';
import { BaseChart } from './BaseChart';
import type { VizConfig } from '../../grafeovidajo';
import { BaseViewClass } from '../BaseViewClass';
import type { IEisenhower, EisenhowerItem } from './EisenhowerMatrix';

export interface EisenhowerConfig extends VizConfig {
  quadrants: {
    urgentImportant: { x: [number, number]; y: [number, number] };
    notUrgentImportant: { x: [number, number]; y: [number, number] };
    urgentNotImportant: { x: [number, number]; y: [number, number] };
    notUrgentNotImportant: { x: [number, number]; y: [number, number] };
  };
}

interface EisenhowerMatrixState {
  showUncategorized: boolean;
}

export class EisenhowerMatrixView extends BaseViewClass<IEisenhower> {
  state: EisenhowerMatrixState = {
    showUncategorized: false,
  };

  get config(): EisenhowerConfig {
    return this.props.config || {
      quadrants: {
        urgentImportant: { x: [0.5, 1], y: [0, 0.5] },
        notUrgentImportant: { x: [0, 0.5], y: [0, 0.5] },
        urgentNotImportant: { x: [0.5, 1], y: [0.5, 1] },
        notUrgentNotImportant: { x: [0, 0.5], y: [0.5, 1] }
      },
      projection: {
        xAttribute: 'urgency',
        yAttribute: 'importance',
        xType: 'continuous',
        yType: 'continuous',
        layout: 'none'
      },
      style: {
        nodeSize: 10,
        nodeColor: '#4a90e2',
        nodeShape: 'circle',
        edgeColor: '#999',
        edgeWidth: 1,
        labels: {
          show: true,
          attribute: 'label',
          fontSize: 12
        }
      }
    };
  }

  getUncategorizedItems() {
    const data = this.state.data;
    if (!data) return [];

    return data.items.filter(item => {
      const hasUrgency = item.urgency !== undefined;
      const hasImportance = item.importance !== undefined;
      return !hasUrgency || !hasImportance;
    });
  }

  getCategorizedItems() {
    const data = this.state.data;
    if (!data) return [];

    return data.items.filter(item => {
      const hasUrgency = item.urgency !== undefined;
      const hasImportance = item.importance !== undefined;
      return hasUrgency && hasImportance;
    });
  }

  getCategorizedData() {
    const categorizedItems = this.getCategorizedItems();

    // Convert to GraphData-like structure for BaseChart
    return {
      nodes: categorizedItems.map(item => ({
        id: item.id,
        label: item.label,
        attributes: {
          urgency: item.urgency,
          importance: item.importance,
          label: item.label
        }
      })),
      edges: []
    };
  }

  renderQuadrantLines() {
    const { width = 800, height = 600 } = this.props;
    const midX = width / 2;
    const midY = height / 2;

    return (
      <>
        <line
          x1={midX}
          y1={0}
          x2={midX}
          y2={height}
          stroke="#ccc"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
        <line
          x1={0}
          y1={midY}
          x2={width}
          y2={midY}
          stroke="#ccc"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
        <text x={width * 0.25} y={20} textAnchor="middle" fontWeight="bold">
          Urgent
        </text>
        <text x={width * 0.75} y={20} textAnchor="middle" fontWeight="bold">
          Not Urgent
        </text>
        <text x={10} y={height * 0.25} textAnchor="start" fontWeight="bold" transform={`rotate(-90, 10, ${height * 0.25})`}>
          Important
        </text>
        <text x={10} y={height * 0.75} textAnchor="start" fontWeight="bold" transform={`rotate(-90, 10, ${height * 0.75})`}>
          Not Important
        </text>
      </>
    );
  }

  renderUncategorizedList() {
    const uncategorizedItems = this.getUncategorizedItems();
    const categorizedItems = this.getCategorizedItems();

    if (uncategorizedItems.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h4>All Items Are Categorized</h4>
          <p>Great! All {categorizedItems.length} items have both urgency and importance values and are shown on the matrix.</p>
        </div>
      );
    }

    return (
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '20px',
        maxHeight: '300px',
        overflow: 'auto',
        marginTop: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h4 style={{ margin: 0 }}>Uncategorized Items ({uncategorizedItems.length})</h4>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '0.9em'
          }}>
            Missing urgency or importance
          </div>
        </div>

        <ul style={{
          listStyleType: 'none',
          paddingLeft: '0',
          margin: 0
        }}>
          {uncategorizedItems.map(item => {
            return (
              <li key={item.id} style={{ marginBottom: '10px' }}>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => (this.props as any).onItemClick?.(item)}
                  onMouseEnter={() => (this.props as any).onItemHover?.(item)}
                  onMouseLeave={() => (this.props as any).onItemHover?.(null)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      ID: {item.id}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    fontSize: '0.8em'
                  }}>
                    {item.urgency === undefined && (
                      <span style={{
                        backgroundColor: '#ffebee',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        color: '#d32f2f'
                      }}>
                        Missing urgency
                      </span>
                    )}
                    {item.importance === undefined && (
                      <span style={{
                        backgroundColor: '#fff3e0',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        color: '#f57c00'
                      }}>
                        Missing importance
                      </span>
                    )}
                    {item.urgency !== undefined && (
                      <span style={{
                        backgroundColor: '#e3f2fd',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        color: '#1976d2'
                      }}>
                        Urgency: {item.urgency}
                      </span>
                    )}
                    {item.importance !== undefined && (
                      <span style={{
                        backgroundColor: '#e8f5e8',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        color: '#388e3c'
                      }}>
                        Importance: {item.importance}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  renderContent() {
    const { width = 800, height = 600 } = this.props;
    const categorizedItems = this.getCategorizedItems();
    const uncategorizedItems = this.getUncategorizedItems();
    const categorizedData = this.getCategorizedData();

    return (
      <div style={{ position: 'relative' }}>
        {uncategorizedItems.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10
          }}>
            <button
              onClick={() => this.setState({ showUncategorized: !this.state.showUncategorized })}
              style={{
                padding: '8px 16px',
                backgroundColor: this.state.showUncategorized ? '#007acc' : '#f0f0f0',
                color: this.state.showUncategorized ? 'white' : '#333',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              {this.state.showUncategorized ? 'Hide Uncategorized' : `Show Uncategorized (${uncategorizedItems.length})`}
            </button>
          </div>
        )}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
            backgroundColor: '#fafafa'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <div>
                <h3 style={{ margin: 0 }}>Eisenhower Matrix</h3>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                  Using YAML frontmatter attributes: <code>urgency</code> (x-axis, 0-1) and <code>importance</code> (y-axis, 0-1)
                </p>
              </div>
              <div style={{
                fontSize: '0.9em',
                color: '#666',
                backgroundColor: '#f0f0f0',
                padding: '5px 10px',
                borderRadius: '4px'
              }}>
                {categorizedItems.length} on matrix | {uncategorizedItems.length} uncategorized | Total: {categorizedItems.length + uncategorizedItems.length}
              </div>
            </div>
            {categorizedItems.length > 0 && (
              <div style={{
                fontSize: '0.8em',
                color: '#666',
                backgroundColor: '#e8f5e8',
                padding: '5px 10px',
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                Showing {categorizedItems.length} items with both urgency and importance values.
              </div>
            )}

            <svg width={width} height={height} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
              {this.renderQuadrantLines()}
              <BaseChart
                data={categorizedData}
                config={this.config}
                width={width}
                height={height}
                onNodeClick={(this.props as any).onItemClick}
                onNodeHover={(this.props as any).onItemHover}
              />
            </svg>
          </div>

          {this.state.showUncategorized && this.renderUncategorizedList()}
        </div>
      </div>
    );
  }
}

// // Wrapper component for backward compatibility
// export const EisenhowerMatrixView: React.FC<{ slicePath: string; width?: number; height?: number }> = ({
//   slicePath,
//   width = 800,
//   height = 600
// }) => {
//   return (
//     <EisenhowerMatrix
//       slicePath={slicePath}
//       width={width}
//       height={height}
//     />
//   );
// };

// Default export for the view
export default EisenhowerMatrixView;

// Auto-mount in browser environment
if (typeof window !== 'undefined') {
  const config = (window as any).TESTERANTO_VIEW_CONFIG;
  if (config && config.viewKey === 'EisenhowerMatrix') {
    console.log('[EisenhowerMatrix] Auto-mounting EisenhowerMatrixView with config:', config);
    import('react-dom/client').then(({ createRoot }) => {
      const rootElement = document.getElementById('root');
      if (rootElement) {
        const root = createRoot(rootElement);
        root.render(
          <EisenhowerMatrixView
            slicePath={config.dataPath}
            width={window.innerWidth - 40}
            height={window.innerHeight - 40}
          />
        );
      }
    }).catch(error => {
      console.error('[EisenhowerMatrix] Failed to mount:', error);
    });
  }
}
