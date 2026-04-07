import { type VizConfig, type VizComponentProps } from 'grafeovidajo';
import React, { useState } from 'react';
import { BaseChart } from '../BaseChart';

export interface EisenhowerConfig extends VizConfig {
  quadrants: {
    urgentImportant: { x: [number, number]; y: [number, number] };
    notUrgentImportant: { x: [number, number]; y: [number, number] };
    urgentNotImportant: { x: [number, number]; y: [number, number] };
    notUrgentNotImportant: { x: [number, number]; y: [number, number] };
  };
}

export const EisenhowerMatrix: React.FC<VizComponentProps & { config: EisenhowerConfig }> = (props) => {
  const { config, width, height, data } = props;
  const [showUncategorized, setShowUncategorized] = useState(false);

  // Filter nodes to find features that are not categorized (missing urgency or importance)
  // We look for YAML frontmatter attributes: 'urgency' and 'importance'
  const uncategorizedFeatures = data.nodes.filter(node => {
    // Identify feature nodes more flexibly
    // Check node.type or node.attributes.type
    const nodeType = node.type || node.attributes?.type;
    // Consider it a feature if type is 'feature' or if it has certain characteristics
    const isFeature = nodeType === 'feature' ||
      node.id.startsWith('feature:') ||
      (node.attributes?.label && !nodeType); // Heuristic

    if (!isFeature) {
      return false;
    }

    // Check if urgency and importance are present in attributes
    // These should come from YAML frontmatter in the markdown file
    // Also check metadata in case they're stored there
    const urgency = node.attributes?.urgency ?? node.attributes?.metadata?.urgency;
    const importance = node.attributes?.importance ?? node.attributes?.metadata?.importance;

    const hasUrgency = urgency !== undefined;
    const hasImportance = importance !== undefined;

    // Consider uncategorized if missing either urgency or importance
    return !hasUrgency || !hasImportance;
  });

  // Filter nodes that are categorized (have both urgency and importance)
  const categorizedNodes = data.nodes.filter(node => {
    // Identify feature nodes more flexibly
    const nodeType = node.type || node.attributes?.type;
    const isFeature = nodeType === 'feature' ||
      node.id.startsWith('feature:') ||
      (node.attributes?.label && !nodeType); // Heuristic

    if (!isFeature) {
      return false;
    }
    // Also check metadata in case they're stored there
    const urgency = node.attributes?.urgency ?? node.attributes?.metadata?.urgency;
    const importance = node.attributes?.importance ?? node.attributes?.metadata?.importance;

    const hasUrgency = urgency !== undefined;
    const hasImportance = importance !== undefined;
    return hasUrgency && hasImportance;
  });

  // Create a new data object with only categorized nodes for the chart
  // Ensure urgency and importance are properly set for projection
  const categorizedData = {
    ...data,
    nodes: categorizedNodes.map(node => {
      const urgency = node.attributes?.urgency ?? node.attributes?.metadata?.urgency;
      const importance = node.attributes?.importance ?? node.attributes?.metadata?.importance;

      // Convert to numbers if they're strings
      const urgencyNum = typeof urgency === 'string' ? parseFloat(urgency) : urgency;
      const importanceNum = typeof importance === 'string' ? parseFloat(importance) : importance;

      // Return node with urgency and importance in attributes for projection
      return {
        ...node,
        attributes: {
          ...node.attributes,
          urgency: urgencyNum,
          importance: importanceNum
        }
      };
    })
  };

  // Render quadrant lines
  const renderQuadrantLines = () => {
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
  };

  // Render uncategorized features list
  const renderUncategorizedList = () => {
    if (uncategorizedFeatures.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h4>All Features Are Categorized</h4>
          <p>Great! All {categorizedNodes.length} feature nodes have both urgency and importance attributes and are shown on the matrix.</p>
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
          <h4 style={{ margin: 0 }}>Uncategorized Features ({uncategorizedFeatures.length})</h4>
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
          {uncategorizedFeatures.map(node => {
            const urgency = node.attributes?.urgency ?? node.attributes?.metadata?.urgency;
            const importance = node.attributes?.importance ?? node.attributes?.metadata?.importance;

            return (
              <li key={node.id} style={{ marginBottom: '10px' }}>
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
                  onClick={() => props.onNodeClick?.(node)}
                  onMouseEnter={() => props.onNodeHover?.(node)}
                  onMouseLeave={() => props.onNodeHover?.(null)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {node.attributes?.label || node.id}
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      ID: {node.id}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    fontSize: '0.8em'
                  }}>
                    {urgency === undefined && (
                      <span style={{
                        backgroundColor: '#ffebee',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        color: '#d32f2f'
                      }}>
                        Missing urgency
                      </span>
                    )}
                    {importance === undefined && (
                      <span style={{
                        backgroundColor: '#fff3e0',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        color: '#f57c00'
                      }}>
                        Missing importance
                      </span>
                    )}
                    {urgency !== undefined && (
                      <span style={{
                        backgroundColor: '#e3f2fd',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        color: '#1976d2'
                      }}>
                        Urgency: {urgency}
                      </span>
                    )}
                    {importance !== undefined && (
                      <span style={{
                        backgroundColor: '#e8f5e8',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        color: '#388e3c'
                      }}>
                        Importance: {importance}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '0.9em'
        }}>
          <strong>Note:</strong> These features cannot be placed on the Eisenhower matrix because they're missing either <code>urgency</code> or <code>importance</code> attributes in their YAML frontmatter.
          Add these attributes to your feature markdown files to categorize them:
          <pre style={{
            backgroundColor: '#fff',
            padding: '10px',
            borderRadius: '4px',
            marginTop: '5px',
            fontSize: '0.85em',
            overflow: 'auto'
          }}>
            ---
            urgency: 0.7    # Value between 0 and 1
            importance: 0.9 # Value between 0 and 1
            ---
          </pre>
          <p style={{ marginTop: '5px', marginBottom: 0 }}>
            Features are identified by: type='feature', ID starting with 'feature:', or having a label without a specific type.
          </p>
        </div>
      </div>
    );
  };

  // Render toggle button
  const renderToggleButton = () => {
    if (uncategorizedFeatures.length === 0) {
      return null;
    }

    return (
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10
      }}>
        <button
          onClick={() => setShowUncategorized(!showUncategorized)}
          style={{
            padding: '8px 16px',
            backgroundColor: showUncategorized ? '#007acc' : '#f0f0f0',
            color: showUncategorized ? 'white' : '#333',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        >
          {showUncategorized ? 'Hide Uncategorized' : `Show Uncategorized (${uncategorizedFeatures.length})`}
        </button>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {renderToggleButton()}

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
              {categorizedNodes.length} on matrix | {uncategorizedFeatures.length} uncategorized | Total: {categorizedNodes.length + uncategorizedFeatures.length}
            </div>
          </div>
          {categorizedNodes.length > 0 && (
            <div style={{
              fontSize: '0.8em',
              color: '#666',
              backgroundColor: '#e8f5e8',
              padding: '5px 10px',
              borderRadius: '4px',
              marginBottom: '10px'
            }}>
              Showing {categorizedNodes.length} features with both urgency and importance values.
            </div>
          )}

          <svg width={width} height={height} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
            {renderQuadrantLines()}
            <BaseChart {...props} data={categorizedData} />
          </svg>
        </div>

        {showUncategorized && renderUncategorizedList()}
      </div>
    </div>
  );
};
