import React from 'react';

export interface TreeNode {
  type: string;
  path: string;
  name: string;
  children?: Record<string, TreeNode>;
  fileType?: string;
  testData?: any;
  content?: any;
}

export const findNodeInTree = (tree: TreeNode | null, path: string): TreeNode | null => {
  if (!tree || !path) return null;

  const parts = path.split('/').filter(part => part.length > 0);
  let currentNode = tree;

  for (const part of parts) {
    if (currentNode.children && currentNode.children[part]) {
      currentNode = currentNode.children[part];
    } else {
      return null;
    }
  }

  return currentNode;
};

export const getNodeIcon = (node: TreeNode): { icon: string; color: string; bgColor: string } => {
  let icon = '📄';
  let color = '#333';
  let bgColor = 'transparent';

  if (node.fileType === 'documentation') {
    icon = '📚';
    color = '#4caf50';
  } else if (node.fileType === 'test-results') {
    icon = '🧪';
    color = '#ff9800';
  } else if (node.fileType === 'log') {
    icon = '📝';
    color = '#795548';
  } else if (node.fileType === 'test-directory') {
    icon = '📁';
    color = '#9c27b0';
  } else if (node.fileType === 'test-source') {
    icon = '🧪';
    color = '#9c27b0';
  } else if (node.fileType === 'test-artifact') {
    icon = '📎';
    color = '#795548';
  } else if (node.fileType === 'html') {
    icon = '🌐';
    color = '#2196f3';
  } else if (node.fileType === 'javascript') {
    icon = '📜';
    color = '#ff9800';
  }

  if (node.type === 'directory') {
    icon = '📁';
    color = '#007acc';
  } else if (node.type === 'feature') {
    icon = '⭐';
    color = '#ff9800';
  } else if (node.type === 'test-summary') {
    icon = '📊';
    color = '#2196f3';
  } else if (node.type === 'test-job') {
    icon = '📋';
    color = '#9c27b0';
  } else if (node.type === 'test-given') {
    icon = '📝';
    color = '#4caf50';
  } else if (node.type === 'test-when') {
    icon = '⚡';
    color = '#ff9800';
  } else if (node.type === 'test-then') {
    icon = '✅';
    color = '#f44336';
  }

  return { icon, color, bgColor };
};

export const renderTestDetails = (testData: any) => {
  if (!testData || typeof testData !== 'object') {
    return (
      <div style={{ marginTop: '20px' }}>
        <h3>Test Results</h3>
        <p>No test data available or invalid format.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Test Results Details</h3>
      <div style={{
        padding: '15px',
        backgroundColor: testData.failed ? '#ffebee' : '#e8f5e9',
        borderRadius: '4px',
        marginBottom: '20px',
        border: '1px solid #ddd'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <strong>Overall Status:</strong> {testData.failed ? '❌ Failed' : '✅ Passed'}
          </div>
          <div>
            <strong>Total Tests:</strong> {testData.runTimeTests || 0}
          </div>
          <div>
            <strong>Failures:</strong> {testData.fails || 0}
          </div>
          {testData.features && (
            <div>
              <strong>Features:</strong> {testData.features.length}
            </div>
          )}
        </div>
      </div>

      {testData.testJob && testData.testJob.givens && (
        <div>
          <h4>Test Cases ({testData.testJob.givens.length})</h4>
          {testData.testJob.givens.map((given: any, index: number) => (
            <div
              key={index}
              style={{
                marginBottom: '20px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '15px',
                backgroundColor: given.failed ? '#ffebee' : '#e8f5e9'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {given.key || `Test Case ${index + 1}`}
                </div>
                <div style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  backgroundColor: given.failed ? '#f44336' : '#4caf50',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {given.failed ? '❌ Failed' : '✅ Passed'}
                </div>
              </div>

              {given.features && given.features.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Features:</div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '5px',
                    marginBottom: '10px'
                  }}>
                    {given.features.map((feature: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: '#e3f2fd',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.85rem'
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {given.whens && given.whens.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Steps:</div>
                  <div style={{
                    padding: '10px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: '1px solid #eee'
                  }}>
                    {given.whens.map((w: any, i: number) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: i < given.whens.length - 1 ? '5px' : '0'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: w.status ? '#4caf50' : '#f44336',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '10px',
                          fontSize: '0.8rem'
                        }}>
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{w.name}</div>
                          {w.error && (
                            <div style={{ fontSize: '0.8rem', color: '#f44336' }}>
                              Error: {typeof w.error === 'string' ? w.error : JSON.stringify(w.error)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {given.thens && given.thens.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Assertions:</div>
                  <div style={{
                    padding: '10px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: '1px solid #eee'
                  }}>
                    {given.thens.map((then: any, i: number) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: i < given.thens.length - 1 ? '5px' : '0'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: then.status ? '#4caf50' : '#f44336',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '10px',
                          fontSize: '0.7rem'
                        }}>
                          {then.status ? '✓' : '✗'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{then.name}</div>
                          {then.error && (
                            <div style={{ fontSize: '0.8rem', color: '#f44336' }}>
                              Error: {typeof then.error === 'string' ? then.error : JSON.stringify(then.error)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {given.error && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#ffcdd2',
                  borderRadius: '4px',
                  border: '1px solid #f44336'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Error Details:</div>
                  <pre style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                  }}>
                    {Array.isArray(given.error) ?
                      given.error.map((err: any, i: number) =>
                        typeof err === 'string' ? err : JSON.stringify(err, null, 2)
                      ).join('\n')
                      : JSON.stringify(given.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {testData.features && testData.features.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h4>All Features ({testData.features.length})</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '10px',
            marginTop: '10px'
          }}>
            {testData.features.map((feature: string, index: number) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
