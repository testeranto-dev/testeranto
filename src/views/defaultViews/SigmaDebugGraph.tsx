import React, { useEffect, useRef } from 'react';
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSetSettings, useSigma } from '@react-sigma/core';
import { DirectedGraph } from 'graphology';
// Using a local omit function to avoid lodash dependency
const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj } as any;
  keys.forEach(key => delete result[key]);
  return result;
};
// CSS import removed due to build error - component should still work
// import '@react-sigma/core/lib/react-sigma.min.css';
import type { GraphData } from '../../graph';
import type { DebugGraphConfig } from './DebugGraphView';

interface SigmaDebugGraphProps {
  data: GraphData;
  config: DebugGraphConfig;
  width: number;
  height: number;
  onNodeClick?: (node: any) => void;
  onNodeHover?: (node: any | null) => void;
}

const SigmaGraph: React.FC<SigmaDebugGraphProps> = ({ data, config, onNodeClick, onNodeHover }) => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const setSettings = useSetSettings();
  const loadGraph = useLoadGraph();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create a new graphology graph
    const graph = new DirectedGraph();

    // Add nodes
    data.nodes.forEach(node => {
      graph.addNode(node.id, {
        label: node.label || node.id,
        size: config.nodeSize || 5,
        color: config.nodeColor || '#4a90e2',
        x: Math.random() * 100,
        y: Math.random() * 100,
        ...omit(node, ['id', 'label'])
      });
    });

    // Add edges
    data.edges?.forEach(edge => {
      try {
        graph.addEdge(edge.source, edge.target, {
          size: config.edgeSize || 1,
          color: config.edgeColor || '#999',
          ...omit(edge.attributes || {}, ['source', 'target'])
        });
      } catch (error) {
        console.warn(`Failed to add edge ${edge.source} -> ${edge.target}:`, error);
      }
    });

    // Load the graph
    loadGraph(graph);

    // Configure settings
    setSettings({
      nodeReducer: (node, data) => {
        return {
          ...data,
          label: config.showLabels && data.size > (config.labelThreshold || 0) ? data.label : '',
          labelSize: config.labelSize || 12,
          labelColor: config.labelColor || '#333'
        };
      },
      edgeReducer: (edge, data) => {
        return {
          ...data,
          color: config.edgeColor || '#999',
          size: config.edgeSize || 1
        };
      },
      renderLabels: config.showLabels !== false,
      labelDensity: 1,
      labelGridCellSize: 100,
      labelRenderedSizeThreshold: 0,
      labelFont: 'Arial',
      zIndex: true
    });

    // Register events
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

    // Fit the graph to view
    setTimeout(() => {
      sigma.getCamera().animatedReset({ duration: 500 });
    }, 100);

  }, [data, config, loadGraph, setSettings, registerEvents, sigma, onNodeClick, onNodeHover]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000,
        fontSize: '12px'
      }}>
        <div><strong>Debug Graph View (Sigma.js)</strong></div>
        <div>Nodes: {data.nodes.length}</div>
        <div>Edges: {data.edges?.length || 0}</div>
        <div>Click and drag to pan</div>
        <div>Scroll to zoom</div>
        <div>Click nodes for details</div>
      </div>
    </div>
  );
};

export const SigmaDebugGraph: React.FC<SigmaDebugGraphProps> = (props) => {
  return (
    <SigmaContainer 
      style={{ 
        width: '100%', 
        height: '100%' 
      }}
      settings={{
        renderLabels: props.config.showLabels !== false,
        labelDensity: 1,
        labelGridCellSize: 100,
        labelRenderedSizeThreshold: 0,
        labelFont: 'Arial',
        zIndex: true,
        defaultNodeColor: props.config.nodeColor || '#4a90e2',
        defaultEdgeColor: props.config.edgeColor || '#999',
        defaultNodeSize: props.config.nodeSize || 5,
        defaultEdgeSize: props.config.edgeSize || 1
      }}
    >
      <SigmaGraph {...props} />
    </SigmaContainer>
  );
};
