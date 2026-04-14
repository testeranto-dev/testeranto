import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { View, ViewProps } from './View';

export interface ViewConfig {
  /** Unique identifier for the view */
  id: string;
  /** Display name */
  name: string;
  /** Path to the JSON data file */
  dataPath: string;
  /** React component to render */
  component: React.ComponentType<any>;
  /** Default configuration */
  defaultConfig?: Record<string, any>;
}

export interface ViewManagerProps {
  /** Initial active view ID */
  initialViewId?: string;
  /** Available views */
  views: ViewConfig[];
  /** Children to render (could include view selector UI) */
  children?: ReactNode;
  /** Whether we're in static mode */
  staticMode?: boolean;
  /** Function to send updates to the server */
  onSendUpdate?: (path: string, data: any) => Promise<void>;
  /** WebSocket connection for real-time updates */
  wsConnection?: WebSocket | null;
}

interface ViewManagerContextType {
  activeViewId: string;
  setActiveViewId: (id: string) => void;
  views: ViewConfig[];
  staticMode: boolean;
  wsUpdate?: { path: string; type: string };
}

const ViewManagerContext = createContext<ViewManagerContextType | undefined>(undefined);

export function useViewManager() {
  const context = useContext(ViewManagerContext);
  if (!context) {
    throw new Error('useViewManager must be used within a ViewManagerProvider');
  }
  return context;
}

export function ViewManager({
  initialViewId,
  views,
  children,
  staticMode = true,
  onSendUpdate,
  wsConnection,
}: ViewManagerProps) {
  const [activeViewId, setActiveViewId] = useState(initialViewId || views[0]?.id || '');
  const [wsUpdate, setWsUpdate] = useState<{ path: string; type: string } | undefined>(undefined);

  // Handle WebSocket messages
  useEffect(() => {
    if (!wsConnection || staticMode) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'update' && message.path) {
          setWsUpdate({ path: message.path, type: message.type });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsConnection.addEventListener('message', handleMessage);
    return () => {
      wsConnection.removeEventListener('message', handleMessage);
    };
  }, [wsConnection, staticMode]);

  const activeView = views.find(view => view.id === activeViewId);

  const contextValue: ViewManagerContextType = {
    activeViewId,
    setActiveViewId,
    views,
    staticMode,
    wsUpdate,
  };

  return (
    <ViewManagerContext.Provider value={contextValue}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {children}
        <div style={{ flex: 1, padding: '20px' }}>
          {activeView ? (
            <View
              dataPath={activeView.dataPath}
              component={activeView.component}
              staticMode={staticMode}
              onSendUpdate={onSendUpdate}
              wsUpdate={wsUpdate}
            />
          ) : (
            <div>No view selected</div>
          )}
        </div>
      </div>
    </ViewManagerContext.Provider>
  );
}
