import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

export interface StakeholderData {
  documentation: {
    files: string[];
    timestamp?: number;
  };
  testResults: Record<string, any>;
  errors: Array<{
    configKey: string;
    testName: string;
    message: string;
    lastAttempt?: any;
    triedPaths?: string[];
  }>;
  configs: {
    runtimes: Record<string, {
      runtime: string;
      tests: string[];
      dockerfile: string;
    }>;
    documentationGlob?: string;
    stakeholderReactModule?: string;
  };
  timestamp: string;
  workspaceRoot: string;
  featureTree?: any;
}

export interface StakeholderAppProps {
  data: StakeholderData;
}

export const DefaultStakeholderApp: React.FC<StakeholderAppProps> = ({ data }) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['.', 'root']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<any>(null);

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handleFileSelect = (node: any) => {
    setSelectedFile(node.path);
    
    // Handle test results with internal structure
    if (node.fileType === 'test-results') {
      if (node.testData) {
        // If node has testData, use it
        setSelectedFileContent(node.testData);
      } else if (node.children) {
        // If node has children (internal structure), show a summary
        setSelectedFileContent({
          type: 'test-results-tree',
          path: node.path,
          name: node.name,
          children: node.children
        });
      } else {
        setSelectedFileContent(null);
      }
    } else if (node.content !== null && node.content !== undefined) {
      setSelectedFileContent(node.content);
    } else if (node.children) {
      // For nodes with children but no content, show their structure
      setSelectedFileContent({
        type: 'tree-node',
        path: node.path,
        name: node.name,
        children: node.children
      });
    } else {
      setSelectedFileContent(null);
    }
  };

  const findNodeInTree = (tree: any, path: string): any | null => {
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

  const renderTree = (node: any, depth: number = 0) => {
    if (!node) return null;
    
    const paddingLeft = depth * 20;
    const isExpanded = expandedPaths.has(node.path);
    
    if (node.type === 'directory') {
      return (
        <div key={node.path} style={{ marginLeft: paddingLeft, marginBottom: '5px' }}>
          <div 
            style={{ 
              fontWeight: 'bold', 
              color: '#007acc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={() => toggleExpand(node.path)}
          >
            <span style={{ marginRight: '5px' }}>
              {isExpanded ? '📂' : '📁'}
            </span>
            {node.name}
            <span style={{ fontSize: '0.8rem', marginLeft: '5px', color: '#666' }}>
              ({Object.keys(node.children || {}).length} items)
            </span>
          </div>
          {isExpanded && node.children && Object.keys(node.children).length > 0 && (
            <div style={{ marginLeft: '10px' }}>
              {Object.values(node.children).map((child: any) => 
                renderTree(child, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    } else if (node.type === 'file') {
      let icon = '📄';
      let color = '#333';
      let bgColor = 'transparent';
      
      if (node.fileType === 'documentation') {
        icon = '📚';
        color = '#4caf50';
        bgColor = selectedFile === node.path ? '#e8f5e9' : 'transparent';
      } else if (node.fileType === 'test-results') {
        icon = '🧪';
        color = '#ff9800';
        bgColor = selectedFile === node.path ? '#fff3e0' : 'transparent';
      } else if (node.fileType === 'test-directory') {
        icon = '📁';
        color = '#9c27b0';
        bgColor = selectedFile === node.path ? '#f3e5f5' : 'transparent';
      } else if (node.fileType === 'test-artifact') {
        icon = '📎';
        color = '#795548';
        bgColor = selectedFile === node.path ? '#efebe9' : 'transparent';
      } else if (node.fileType === 'html') {
        icon = '🌐';
        color = '#2196f3';
        bgColor = selectedFile === node.path ? '#e3f2fd' : 'transparent';
      } else if (node.fileType === 'javascript') {
        icon = '📜';
        color = '#ff9800';
        bgColor = selectedFile === node.path ? '#fff3e0' : 'transparent';
      }
      
      const hasChildren = node.children && Object.keys(node.children).length > 0;
      const isExpanded = expandedPaths.has(node.path);
      
      return (
        <div 
          key={node.path} 
          style={{ 
            marginLeft: paddingLeft, 
            marginBottom: '3px',
            backgroundColor: bgColor,
            borderRadius: '4px',
            padding: '5px',
            cursor: 'pointer'
          }}
        >
          <div 
            style={{ color, display: 'flex', alignItems: 'center' }}
            onClick={() => handleFileSelect(node)}
          >
            <span style={{ marginRight: '5px' }}>{icon}</span>
            {node.name}
            {node.fileType && (
              <span style={{ fontSize: '0.8rem', marginLeft: '5px', color: '#666' }}>
                ({node.fileType})
              </span>
            )}
            {hasChildren && (
              <span 
                style={{ 
                  marginLeft: '5px', 
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.path);
                }}
              >
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
          </div>
          {node.testData && (
            <div style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#666' }}>
              <div>
                Status: {node.testData.failed ? '❌ Failed' : '✅ Passed'} | 
                Tests: {node.testData.runTimeTests || 0} | 
                Fails: {node.testData.fails || 0}
              </div>
            </div>
          )}
          {hasChildren && isExpanded && (
            <div style={{ marginLeft: '10px', marginTop: '5px' }}>
              {Object.values(node.children).map((child: any) => 
                renderTree(child, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    } else if (node.type === 'feature' || node.type === 'test-summary' || 
               node.type === 'test-job' || node.type === 'test-given' || 
               node.type === 'test-when' || node.type === 'test-then') {
      let icon = '⭐';
      let color = '#ff9800';
      
      switch (node.type) {
        case 'test-summary':
          icon = '📊';
          color = '#2196f3';
          break;
        case 'test-job':
          icon = '📋';
          color = '#9c27b0';
          break;
        case 'test-given':
          icon = '📝';
          color = '#4caf50';
          break;
        case 'test-when':
          icon = '⚡';
          color = '#ff9800';
          break;
        case 'test-then':
          icon = '✅';
          color = '#f44336';
          break;
      }
      
      const hasChildren = node.children && Object.keys(node.children).length > 0;
      const isExpanded = expandedPaths.has(node.path);
      
      return (
        <div key={node.path} style={{ marginLeft: paddingLeft, marginBottom: '3px' }}>
          <div style={{ color, display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '5px' }}>{icon}</span>
            {node.name}
            {hasChildren && (
              <span 
                style={{ 
                  marginLeft: '5px', 
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.path);
                }}
              >
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div style={{ marginLeft: '10px', marginTop: '5px' }}>
              {Object.values(node.children).map((child: any) => 
                renderTree(child, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  const renderTestDetails = (testData: any) => {
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

  const renderFileContent = () => {
    if (!selectedFile) return null;
    
    // Check if it's a test results file
    if (selectedFileContent && typeof selectedFileContent === 'object') {
      // Check if it has testJob structure (tests.json)
      if (selectedFileContent.testJob) {
        return renderTestDetails(selectedFileContent);
      } else {
        // For other objects, render as JSON
        return (
          <div style={{ marginTop: '20px' }}>
            <h3>File Content</h3>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(selectedFileContent, null, 2)}
            </pre>
          </div>
        );
      }
    } else if (selectedFileContent) {
      // Check if it's a documentation file (markdown)
      const isMarkdown = selectedFile && (selectedFile.endsWith('.md') || selectedFile.endsWith('.markdown'));
      
      if (isMarkdown && typeof selectedFileContent === 'string') {
        // For markdown, we could render it, but for now just show as plain text
        return (
          <div style={{ marginTop: '20px' }}>
            <h3>Documentation: {selectedFile.split('/').pop()}</h3>
            <div style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '20px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '500px',
              border: '1px solid #ddd'
            }}>
              <pre style={{ 
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.5',
                margin: 0
              }}>
                {selectedFileContent}
              </pre>
            </div>
          </div>
        );
      } else if (typeof selectedFileContent === 'string') {
        return (
          <div style={{ marginTop: '20px' }}>
            <h3>File Content</h3>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {selectedFileContent}
            </pre>
          </div>
        );
      }
    } else {
      return (
        <div style={{ marginTop: '20px' }}>
          <h3>No content available for {selectedFile}</h3>
          <p>The file exists in the tree but its content could not be loaded.</p>
        </div>
      );
    }
    
    // Fallback
    return null;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', display: 'flex', gap: '20px' }}>
      <div style={{ flex: '0 0 300px', borderRight: '1px solid #ddd', paddingRight: '20px' }}>
        <h2>Source Structure</h2>
        <div style={{ 
          border: '1px solid #ddd', 
          padding: '15px', 
          background: '#f9f9f9',
          maxHeight: '600px',
          overflow: 'auto'
        }}>
          {data.featureTree ? renderTree(data.featureTree) : (
            <div>
              <p>No feature tree available. The tree should show documentation files in their proper folder structure.</p>
              <p>Documentation files found: {data.documentation?.files?.length || 0}</p>
              <div style={{ 
                border: '1px solid #eee', 
                padding: '10px', 
                background: '#fff',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {data.documentation?.files?.map((file, i) => (
                  <div key={i} style={{ 
                    fontSize: '0.8rem', 
                    marginBottom: '2px',
                    padding: '2px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    {file}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h3>Tree Structure</h3>
          <p>This tree shows all documentation and test files organized by their actual paths in the project.</p>
          <p>Click on any file to view its contents.</p>
        </div>
      </div>
      
      <div style={{ flex: '1' }}>
        <h1>Testeranto Report</h1>
        <p>Generated: {new Date(data.timestamp).toLocaleString()}</p>
        <p>Workspace: {data.workspaceRoot}</p>
        
        {selectedFile && (
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
            <strong>Selected:</strong> {selectedFile}
          </div>
        )}
        
        {renderFileContent()}
        
        {!selectedFile && (
          <div>
            <h2>Overview</h2>
            <p>Select a file from the tree to view its contents.</p>
            <p>Documentation files are shown with 📚 icon, test results with 🧪 icon.</p>
            
            <h3>Configuration</h3>
            {data.configs?.runtimes ? (
              <div>
                <p>Found {Object.keys(data.configs.runtimes).length} runtimes:</p>
                {Object.entries(data.configs.runtimes).map(([key, runtime]: [string, any]) => (
                  <div key={key} style={{ marginBottom: '10px', padding: '5px', borderLeft: '3px solid #007acc' }}>
                    <strong>{key}</strong> ({runtime.runtime})
                    <div style={{ marginLeft: '10px' }}>
                      Tests: {runtime.tests?.length || 0}
                      {runtime.tests?.map((test: string, i: number) => (
                        <div key={i} style={{ fontSize: '12px' }}>{test}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No configuration found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Function to render the app
export function renderApp(rootElement: HTMLElement, data: StakeholderData) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <DefaultStakeholderApp data={data} />
    </React.StrictMode>
  );
}

// Export for use in HTML
export default DefaultStakeholderApp;
