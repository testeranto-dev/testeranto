import React, { useState, useEffect, useCallback } from 'react';

export interface ViewProps<T = any> {
  /** Path to the JSON data file */
  dataPath: string;
  /** React component to render the data */
  component: React.ComponentType<{ data: T; onUpdate?: (data: T) => void }>;
  /** Whether we're in static mode (read-only) */
  staticMode?: boolean;
  /** Function to send updates to the server (only used in dynamic mode) */
  onSendUpdate?: (path: string, data: T) => Promise<void>;
}

/**
 * A View component that watches a JSON file and renders data.
 * In static mode, it only reads from the file.
 * In dynamic mode, it can send updates back to the server.
 */
export function View<T = any>({
  dataPath,
  component: Component,
  staticMode = true,
  onSendUpdate,
}: ViewProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from the JSON file
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the dataPath
      // For now, we'll simulate with a timeout
      const response = await fetch(dataPath);
      if (!response.ok) {
        throw new Error(`Failed to load data from ${dataPath}`);
      }
      const jsonData = await response.json();
      setData(jsonData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading view data:', err);
    } finally {
      setLoading(false);
    }
  }, [dataPath]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up polling to watch for changes (in a real app, use WebSocket or File System API)
  useEffect(() => {
    if (staticMode) return;

    const interval = setInterval(() => {
      loadData();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [staticMode, loadData]);

  // Handle updates from the component
  const handleUpdate = useCallback(async (newData: T) => {
    if (staticMode) {
      console.warn('Cannot send updates in static mode');
      return;
    }

    if (!onSendUpdate) {
      console.error('No update function provided');
      return;
    }

    try {
      await onSendUpdate(dataPath, newData);
      // After successful update, reload data
      loadData();
    } catch (err) {
      console.error('Error sending update:', err);
      setError(err instanceof Error ? err.message : 'Failed to send update');
    }
  }, [staticMode, onSendUpdate, dataPath, loadData]);

  if (loading) {
    return <div>Loading view data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>No data available</div>;
  }

  return <Component data={data} onUpdate={staticMode ? undefined : handleUpdate} />;
}
