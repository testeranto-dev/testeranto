import React, { useEffect } from 'react';
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSetSettings, useSigma } from '@react-sigma/core';
import { DirectedGraph } from 'graphology';
const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj } as any;
  keys.forEach(key => delete result[key]);
  return result;
};
import type { GraphData } from '../../../graph';
import type { DebugGraphConfig } from './DebugGraphView';

interface SigmaDebugGraphProps {
  data: GraphData;
  config: DebugGraphConfig;
  width: number;
  height: number;
  onNodeClick?: (node: any) => void;
  onNodeHover?: (node: any | null) => void;
}

const SigmaGraph: React.FC<SigmaDebugGraphProps> = (props) => {
  const { data, config, onNodeClick, onNodeHover, width, height } = props;
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const setSettings = useSetSettings();
  const loadGraph = useLoadGraph();

  useEffect(() => {
    // First, ensure sigma is available
    if (!sigma) {
      console.log('[SigmaDebugGraph] Sigma not available yet');
      return;
    }

    // Check if we have valid data
    if (!data || !data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      console.error('[SigmaDebugGraph] No valid data provided');
      return;
    }

    console.log(`[SigmaDebugGraph] Processing ${data.nodes.length} nodes`);

    // Create a new graph instance
    const graph = new DirectedGraph();

    // Add nodes with basic attributes
    data.nodes.forEach((node, index) => {
      try {
        // Ensure node has required properties
        const nodeId = node.id || `node-${index}`;

        // Check if node already exists
        if (graph.hasNode(nodeId)) {
          console.warn(`[SigmaDebugGraph] Node ${nodeId} already exists, skipping`);
          return;
        }

        // Don't include label property to prevent label rendering
        // Use simple attributes to avoid Sigma.js compatibility issues
        graph.addNode(nodeId, {
          // Don't include label
          size: config.nodeSize || 8,
          color: config.nodeColor || '#4a90e2',
          x: Math.random() * 100,
          y: Math.random() * 100
        });
      } catch (error) {
        console.error(`[SigmaDebugGraph] Error adding node ${index}:`, error);
      }
    });

    // Add edges if available
    if (data.edges && Array.isArray(data.edges)) {
      data.edges.forEach((edge, index) => {
        if (edge.source && edge.target) {
          try {
            graph.addEdge(edge.source, edge.target, {
              size: config.edgeSize || 1,
              color: config.edgeColor || '#999'
            });
          } catch (error) {
            console.warn(`[SigmaDebugGraph] Could not add edge ${index}:`, error);
          }
        }
      });
    }

    // Load the graph into Sigma
    console.log(`[SigmaDebugGraph] Loading graph with ${graph.nodes().length} nodes`);
    loadGraph(graph);

    // Set settings with minimal configuration to avoid errors
    setSettings({
      nodeReducer: (node, data) => {
        return {
          ...data,
          // Don't include label at all to prevent label rendering
          // Remove label property entirely
          ...(data.label ? {} : {})
        };
      },
      edgeReducer: (edge, data) => {
        return {
          ...data,
          color: config.edgeColor || '#999',
          size: config.edgeSize || 1
        };
      },
      // Completely disable all label rendering
      renderLabels: false,
      defaultDrawEdgeLabel: false,
      defaultDrawNodeLabel: false,
      enableHovering: false,
      zIndex: true
    });

    // Set up event handlers
    registerEvents({
      clickNode: (event) => {
        const node = graph.getNodeAttributes(event.node);
        if (onNodeClick) {
          onNodeClick({ id: event.node, ...node });
        }
      },
      enterNode: (event) => {
        if (onNodeHover) {
          const node = graph.getNodeAttributes(event.node);
          onNodeHover({ id: event.node, ...node });
        }
      },
      leaveNode: () => {
        if (onNodeHover) {
          onNodeHover(null);
        }
      }
    });

    // Get container reference
    const container = sigma.getContainer();

    // Force a refresh after a short delay to ensure container has dimensions
    const timer = setTimeout(() => {
      console.log(`[SigmaDebugGraph] Refreshing camera, sigma available:`, !!sigma);
      if (sigma && sigma.getCamera()) {
        console.log(`[SigmaDebugGraph] Resetting camera`);
        sigma.getCamera().animatedReset({ duration: 500 });
        sigma.refresh();

        // Force Sigma to redraw
        sigma.refresh();
      }

      // Also check container dimensions
      if (container) {
        console.log(`[SigmaDebugGraph] Container client dimensions:`, container.clientWidth, container.clientHeight);
        console.log(`[SigmaDebugGraph] Container offset dimensions:`, container.offsetWidth, container.offsetHeight);

        // If dimensions are still 0, force a resize
        if (container.clientWidth === 0 || container.clientHeight === 0) {
          console.warn('[SigmaDebugGraph] Container still has zero dimensions, forcing resize');
          // Trigger a window resize event
          window.dispatchEvent(new Event('resize'));
        }
      }
    }, 100);

    // Add resize observer
    const resizeObserver = new ResizeObserver(() => {
      console.log('[SigmaDebugGraph] Container resized');
      if (sigma && sigma.getCamera()) {
        sigma.refresh();
      }
    });

    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [data, config, loadGraph, setSettings, registerEvents, sigma, onNodeClick, onNodeHover, width, height]);

  // SigmaGraph doesn't render any DOM elements itself, but we need to return something
  return <></>;
};

export const SigmaDebugGraph: React.FC<SigmaDebugGraphProps> = (props) => {
  const { width, height, data } = props;
  const config = props.config || {};

  // Ensure we have valid dimensions
  const actualWidth = Math.max(width || 800, 400);
  const actualHeight = Math.max(height || 600, 400);

  console.log(`[SigmaDebugGraph] Container dimensions: ${actualWidth}x${actualHeight}`);

  return (
    <div style={{
      width: `${actualWidth}px`,
      height: `${actualHeight}px`,
      minWidth: '400px',
      minHeight: '400px',
      position: 'relative',
      border: '3px solid red', // Debug border
      backgroundColor: 'rgba(255, 0, 0, 0.1)' // Semi-transparent red background
    }}>
      <SigmaContainer
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        settings={{
          // Completely disable all label rendering
          renderLabels: false,
          // Disable all label-related features
          defaultDrawEdgeLabel: false,
          defaultDrawNodeLabel: false,
          // Disable hover labels
          enableHovering: false,
          // Basic Sigma.js settings
          zIndex: true,
          defaultNodeColor: config.nodeColor || '#4a90e2',
          defaultEdgeColor: config.edgeColor || '#999',
          defaultNodeSize: config.nodeSize || 5,
          defaultEdgeSize: config.edgeSize || 1,
          allowInvalidContainer: true,
          autoResize: true,
          // Camera settings
          camera: {
            ratio: 1,
            angle: 0,
            x: 0.5,
            y: 0.5
          }
        }}
        graph={null}
        initialSettings={{
          autoResize: true,
          allowInvalidContainer: false,
          // Ensure all label rendering is disabled
          renderLabels: false,
          defaultDrawEdgeLabel: false,
          defaultDrawNodeLabel: false,
          enableHovering: false
        }}
      >
        <SigmaGraph {...props} width={actualWidth} height={actualHeight} />
      </SigmaContainer>
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 10000,
        fontSize: '12px',
        border: '1px solid #ccc'
      }}>
        <div><strong>Debug Graph View (Sigma.js)</strong></div>
        <div>Nodes: {data?.nodes?.length || 0}</div>
        <div>Edges: {data?.edges?.length || 0}</div>
        <div>Click and drag to pan</div>
        <div>Scroll to zoom</div>
        <div>Click nodes for details</div>
      </div>
    </div>
  );
};
