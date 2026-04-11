// import React, { useState, useEffect } from 'react';
// import type { GraphData } from '../graph';

// export interface BaseViewProps<T = GraphData> {
//   /** Path to the slice JSON file */
//   slicePath: string;
//   /** React component to render the data */
//   component: React.ComponentType<ViewComponentProps<T>>;
//   /** Optional configuration for the view */
//   config?: Record<string, any>;
//   /** Width of the view */
//   width?: number;
//   /** Height of the view */
//   height?: number;
// }

// export interface ViewComponentProps<T = GraphData> {
//   /** The slice data loaded from JSON */
//   data: T;
//   /** View configuration */
//   config?: Record<string, any>;
//   /** Width of the view */
//   width?: number;
//   /** Height of the view */
//   height?: number;
//   /** Called when a node is clicked */
//   onNodeClick?: (node: any) => void;
//   /** Called when a node is hovered */
//   onNodeHover?: (node: any | null) => void;
//   /** Called when a node is updated (for interactive views) */
//   onNodeUpdate?: (nodeId: string, updatedAttributes: any) => void;
// }

// /**
//  * BaseView component that handles loading slice data from JSON files.
//  * All views should use this as their parent component.
//  */
// export function BaseView<T = GraphData>({
//   slicePath,
//   component: Component,
//   config = {},
//   width = 800,
//   height = 600,
// }: BaseViewProps<T>): React.ReactElement {
//   console.log(`[BaseView] Component rendered with slicePath: ${slicePath}`);
  
//   const [data, setData] = useState<T | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Load data from the slice JSON file
//   useEffect(() => {
//     console.log(`[BaseView] useEffect triggered at ${new Date().toISOString()} with slicePath: ${slicePath}`);
//     console.log(`[BaseView] Component props:`, { slicePath, width, height, config });
    
//     if (!slicePath) {
//       console.error('[BaseView] slicePath is empty or undefined');
//       setError('slicePath is empty or undefined');
//       setLoading(false);
//       return;
//     }

//     let isMounted = true;
    
//     const loadData = async () => {
//       if (!isMounted) {
//         console.log('[BaseView] Component unmounted, skipping fetch');
//         return;
//       }
      
//       try {
//         console.log(`[BaseView] Starting fetch from: ${slicePath}`);
//         console.log(`[BaseView] Full URL would be: ${window.location.origin}${slicePath.startsWith('/') ? '' : '/'}${slicePath}`);
        
//         const startTime = Date.now();
//         console.log(`[BaseView] Fetch start time: ${startTime}`);
        
//         const response = await fetch(slicePath);
//         const endTime = Date.now();
//         console.log(`[BaseView] Fetch completed in ${endTime - startTime}ms, status: ${response.status}, ok: ${response.ok}`);
        
//         if (!response.ok) {
//           // Try to get more details from the response
//           let errorDetails = `${response.status} ${response.statusText}`;
//           try {
//             const text = await response.text();
//             if (text) {
//               errorDetails += ` - ${text.substring(0, 200)}`;
//             }
//           } catch {
//             // Ignore if we can't read response text
//           }
//           throw new Error(`Failed to load slice data from ${slicePath}: ${errorDetails}`);
//         }
        
//         const jsonData = await response.json();
//         console.log(`[BaseView] Data loaded successfully, nodes: ${jsonData?.nodes?.length || 0}, edges: ${jsonData?.edges?.length || 0}`);
//         console.log(`[BaseView] First few nodes:`, jsonData?.nodes?.slice(0, 3));
        
//         if (isMounted) {
//           setData(jsonData);
//           setError(null);
//         }
//       } catch (err) {
//         console.error('[BaseView] Error loading view data:', err);
//         console.error('[BaseView] Error stack:', err instanceof Error ? err.stack : 'No stack');
//         if (isMounted) {
//           setError(err instanceof Error ? err.message : 'Unknown error loading slice data');
//         }
//       } finally {
//         if (isMounted) {
//           setLoading(false);
//           console.log('[BaseView] Loading set to false');
//         }
//       }
//     };

//     loadData();

//     return () => {
//       console.log('[BaseView] useEffect cleanup');
//       isMounted = false;
//     };
//   }, [slicePath]);

//   // Handle node click
//   const handleNodeClick = (node: any) => {
//     console.log('Node clicked:', node);
//     // In the future, this could trigger navigation or other actions
//   };

//   // Handle node hover
//   const handleNodeHover = (node: any | null) => {
//     if (node) {
//       console.log('Node hover:', node.id);
//     }
//   };

//   // Handle node update (for interactive views)
//   const handleNodeUpdate = (nodeId: string, updatedAttributes: any) => {
//     console.log('Node update requested:', nodeId, updatedAttributes);
//     // In the future, this could send updates to the server
//   };

//   console.log(`[BaseView] Render - loading: ${loading}, error: ${error}, data: ${data ? 'present' : 'null'}`);
  
//   // Always show loading state when loading is true
//   if (loading) {
//     console.log(`[BaseView] Rendering loading state for path: ${slicePath}`);
//     // Make sure the fetch is actually running
//     console.log(`[BaseView] Checking if fetch should be running...`);
    
//     return (
//       <div style={{ 
//         display: 'flex', 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         width, 
//         height,
//         border: '1px solid #ccc',
//         borderRadius: '4px',
//         backgroundColor: '#fafafa'
//       }}>
//         <div style={{ textAlign: 'center' }}>
//           <h3>Loading view...</h3>
//           <p>Loading slice data from:</p>
//           <p style={{ 
//             fontFamily: 'monospace', 
//             backgroundColor: '#f0f0f0', 
//             padding: '5px', 
//             borderRadius: '3px',
//             margin: '10px',
//             wordBreak: 'break-all'
//           }}>
//             {slicePath}
//           </p>
//           <p>Full URL: {new URL(slicePath, window.location.href).href}</p>
//           <p>Check browser console for details</p>
//           <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e0e0e0', borderRadius: '4px' }}>
//             <p><strong>Debug info:</strong></p>
//             <p>Component mounted: Yes</p>
//             <p>useEffect triggered: Check console</p>
//             <p>slicePath valid: {slicePath ? 'Yes' : 'No'}</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     console.log(`[BaseView] Rendering error state: ${error}`);
//     return (
//       <div style={{ 
//         padding: '20px', 
//         border: '1px solid #d32f2f',
//         borderRadius: '4px',
//         backgroundColor: '#ffebee',
//         color: '#d32f2f',
//         width,
//         height,
//         overflow: 'auto'
//       }}>
//         <h3>Error loading view</h3>
//         <p><strong>Error message:</strong> {error}</p>
//         <p><strong>Slice path:</strong> {slicePath}</p>
//         <p><strong>Current URL:</strong> {window.location.href}</p>
//         <p><strong>Resolved URL:</strong> {new URL(slicePath, window.location.href).href}</p>
//         <p>Check browser console for network errors and detailed logs.</p>
//         <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
//           <h4>Troubleshooting steps:</h4>
//           <ol>
//             <li>Check if the slice file exists at the expected path</li>
//             <li>Verify the server is running and serving the file</li>
//             <li>Check browser DevTools Network tab for the failed request</li>
//             <li>Ensure CORS headers are properly set if fetching from a different origin</li>
//           </ol>
//         </div>
//       </div>
//     );
//   }

//   if (!data) {
//     return (
//       <div style={{ 
//         padding: '20px', 
//         border: '1px solid #ff9800',
//         borderRadius: '4px',
//         backgroundColor: '#fff3e0',
//         color: '#f57c00',
//         width,
//         height
//       }}>
//         <h3>No data available</h3>
//         <p>Slice data is empty or could not be parsed.</p>
//         <p>Slice path: {slicePath}</p>
//       </div>
//     );
//   }

//   return (
//     <Component
//       data={data}
//       config={config}
//       width={width}
//       height={height}
//       onNodeClick={handleNodeClick}
//       onNodeHover={handleNodeHover}
//       onNodeUpdate={handleNodeUpdate}
//     />
//   );
// }
