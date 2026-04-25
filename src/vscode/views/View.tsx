// import React, { useState, useEffect, useCallback } from 'react';
// import { getSliceFilePath, extractViewName } from './utils';

// export interface ViewProps<T = any> {
//   /** Path to the JSON data file or view identifier */
//   dataPath: string;
//   /** React component to render the data */
//   component: React.ComponentType<{ data: T; onUpdate?: (data: T) => void }>;
//   /** Whether we're in static mode (read-only) */
//   staticMode?: boolean;
//   /** Function to send updates to the server (only used in dynamic mode) */
//   onSendUpdate?: (path: string, data: T) => Promise<void>;
//   /** WebSocket message to trigger reloads */
//   wsUpdate?: { path: string; type: string };
// }

// /**
//  * A View component that watches a JSON file and renders data.
//  * Views use files (JSON slices) + WebSocket notifications for updates.
//  * This is different from VSCode providers which use API endpoints.
//  * 
//  * In static mode, it only reads from the file.
//  * In dynamic mode, it can send updates back to the server and receives WebSocket updates to reload data.
//  */
// export function View<T = any>({
//   dataPath,
//   component: Component,
//   staticMode = true,
//   onSendUpdate,
//   wsUpdate,
// }: ViewProps<T>) {
//   const [data, setData] = useState<T | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Get the actual static file path
//   const viewName = extractViewName(dataPath);
//   const staticFilePath = getSliceFilePath(viewName);

//   // Load data from the static JSON file
//   const loadData = useCallback(async () => {
//     try {
//       setLoading(true);
//       // Construct absolute URL to avoid relative path issues
//       const absolutePath = staticFilePath.startsWith('/') 
//         ? `${window.location.origin}${staticFilePath}`
//         : staticFilePath;
//       console.log(`[View] Loading data from static file: ${absolutePath} (view: ${viewName})`);
//       const response = await fetch(absolutePath);
//       if (!response.ok) {
//         throw new Error(`Failed to load data from ${absolutePath}: ${response.status} ${response.statusText}`);
//       }
//       const jsonData = await response.json();
//       setData(jsonData);
//       setError(null);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Unknown error');
//       console.error('Error loading view data:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [staticFilePath, viewName]);

//   // Initial load
//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   // Reload when WebSocket update matches our view
//   useEffect(() => {
//     if (wsUpdate && wsUpdate.type === 'update') {
//       // Check if the update is for our view
//       const updatedViewName = extractViewName(wsUpdate.path);
//       if (updatedViewName === viewName) {
//         console.log(`[View] WebSocket update received for view: ${viewName}, reloading data`);
//         loadData();
//       }
//     }
//   }, [wsUpdate, viewName, loadData]);

//   // Handle updates from the component
//   const handleUpdate = useCallback(async (newData: T) => {
//     if (staticMode) {
//       console.warn('Cannot send updates in static mode');
//       return;
//     }

//     if (!onSendUpdate) {
//       console.error('No update function provided');
//       return;
//     }

//     try {
//       // Send update to the server using the original dataPath
//       await onSendUpdate(dataPath, newData);
//       // The server will broadcast a WebSocket update which will trigger a reload
//       // So we don't need to reload here
//     } catch (err) {
//       console.error('Error sending update:', err);
//       setError(err instanceof Error ? err.message : 'Failed to send update');
//     }
//   }, [staticMode, onSendUpdate, dataPath]);

//   if (loading) {
//     return <div>Loading view data...</div>;
//   }

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

//   if (!data) {
//     return <div>No data available</div>;
//   }

//   return <Component data={data} onUpdate={staticMode ? undefined : handleUpdate} />;
// }
