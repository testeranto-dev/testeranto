import React, { useRef, useEffect, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import type { GraphData } from '../../../graph';
import * as THREE from 'three';

// Color palette for different node categories
const NODE_TYPE_COLORS: Record<string, string> = {
  'file': '#4CAF50',          // green
  'verb': '#FF9800',          // orange
  'process': '#2196F3',       // blue
  'resource': '#9C27B0',      // purple
  'agent': '#00BCD4',         // cyan
  'view': '#E91E63',          // pink
  'chat': '#F44336',          // red
  'default': '#607D8B',       // blue-grey
};

// More specific type colors for sub-types within a category
const NODE_SPECIFIC_TYPE_COLORS: Record<string, string> = {
  'feature': '#4CAF50',       // green
  'documentation': '#2196F3', // blue
  'config': '#FF9800',        // orange
  'entrypoint': '#9C27B0',    // purple
  'chat_message': '#E91E63',  // pink
  'test': '#F44336',          // red
  'folder': '#8BC34A',        // light green
  'inputFile': '#66BB6A',     // medium green
  'outputFile': '#43A047',    // dark green
  'bdd': '#1E88E5',           // blue
  'builder': '#1565C0',       // dark blue
  'check': '#0D47A1',         // navy
  'runtime': '#7B1FA2',       // purple
  'given': '#FF7043',         // deep orange
  'when': '#FFA726',          // orange
  'then': '#FFCA28',          // amber
  'describe': '#AB47BC',      // purple
  'it': '#8E24AA',            // dark purple
  'confirm': '#26A69A',       // teal
  'value': '#00897B',         // dark teal
  'should': '#00ACC1',        // cyan
  'expected': '#26C6DA',      // light cyan
};

// Color palette for different edge types
const EDGE_TYPE_COLORS: Record<string, string> = {
  'depends': '#FF5722',       // deep orange
  'implements': '#4CAF50',    // green
  'references': '#2196F3',    // blue
  'contains': '#9C27B0',      // purple
  'communicates': '#00BCD4',  // cyan
  'default': '#9E9E9E',       // grey
};

function getNodeCategory(node: any): string {
  // GraphNodeAttributes has type: GraphNodeType = { category: string; type: string }
  if (node.type && typeof node.type === 'object') {
    if (node.type.category) return node.type.category;
    if (node.type.type) return node.type.type;
  }
  // Fallback: try string type
  if (typeof node.type === 'string') return node.type;
  // Try metadata
  if (node.metadata?.type) return node.metadata.type;
  if (node.metadata?.category) return node.metadata.category;
  return 'default';
}

function getNodeSpecificType(node: any): string {
  if (node.type && typeof node.type === 'object') {
    if (node.type.type) return node.type.type;
  }
  if (typeof node.type === 'string') return node.type;
  if (node.metadata?.type) return node.metadata.type;
  return 'default';
}

function getEdgeType(edge: any): string {
  // GraphEdgeAttributes has type: GraphEdgeType = { category: string; type: string; directed: boolean }
  if (edge.type && typeof edge.type === 'object') {
    if (edge.type.type) return edge.type.type;
    if (edge.type.category) return edge.type.category;
  }
  if (edge.attributes?.type) {
    if (typeof edge.attributes.type === 'object') {
      if (edge.attributes.type.type) return edge.attributes.type.type;
      if (edge.attributes.type.category) return edge.attributes.type.category;
    }
    if (typeof edge.attributes.type === 'string') return edge.attributes.type;
  }
  if (edge.label) return edge.label;
  return 'default';
}

export interface DebugGraphV2Props {
  data?: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: any) => void;
  onNodeHover?: (node: any | null) => void;
  onEdgeClick?: (edge: any) => void;
  onEdgeHover?: (edge: any | null) => void;
}

export const DebugGraphV2: React.FC<DebugGraphV2Props> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  onNodeHover,
  onEdgeClick,
  onEdgeHover,
}) => {
  const graphRef = useRef<any>(null);

  // Convert GraphData to the format expected by ForceGraph3D
  const graphData = useMemo(() => {
    if (!data) {
      return { nodes: [], links: [] };
    }

    const nodes = (data.nodes || []).map((n: any) => {
      const category = getNodeCategory(n);
      const specificType = getNodeSpecificType(n);
      // Use specific type color first (e.g., folder gets light green), fallback to category, then default
      let color = NODE_SPECIFIC_TYPE_COLORS[specificType];
      if (!color) {
        color = NODE_TYPE_COLORS[category];
      }
      if (!color) {
        color = NODE_TYPE_COLORS['default'];
      }
      return {
        id: n.id,
        name: n.label || n.id,
        val: n.val || 1,
        color: n.color || color,
        nodeType: category,
        nodeSpecificType: specificType,
        ...n
      };
    });

    const links = (data.edges || []).map((e: any) => {
      const edgeType = getEdgeType(e);
      const color = EDGE_TYPE_COLORS[edgeType] || EDGE_TYPE_COLORS['default'];
      return {
        source: e.source,
        target: e.target,
        color: e.attributes?.color || color,
        width: e.attributes?.weight || 0.5,
        edgeType,
        ...e
      };
    });

    return { nodes, links };
  }, [data]);

  // Create lights array using useMemo so it's stable across renders
  const lights = useMemo(() => {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);

    // Main directional light from top-right
    const dirLight = new THREE.DirectionalLight(0xffffff, 4.0);
    dirLight.position.set(10, 10, 10);

    // Fill light from left
    const fillLight = new THREE.DirectionalLight(0x88aaff, 2.0);
    fillLight.position.set(-10, 5, 5);

    // Back light for rim effect
    const backLight = new THREE.DirectionalLight(0xffaa88, 1.5);
    backLight.position.set(0, -5, -10);

    // Point light near origin for local brightness
    const pointLight = new THREE.PointLight(0xffffff, 3.0, 50);
    pointLight.position.set(0, 0, 0);

    // Hemisphere light for sky/ground color
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362d59, 1.5);

    return [ambientLight, dirLight, fillLight, backLight, pointLight, hemiLight];
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        // Customizing the appearance
        nodeLabel="name"
        nodeAutoColorBy="nodeType"
        // Edge glow effect
        linkDirectionalParticles={4}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={3}
        linkDirectionalParticleColor={() => '#ffffff'}
        linkDirectionalParticleLength={6}
        linkDirectionalParticleOpacity={0.8}
        linkDirectionalParticleResolution={8}
        linkColor={() => '#ffaa00'}
        linkOpacity={0.6}
        linkWidth={1.5}
        backgroundColor="#1a1a2e"
        lights={lights}
      />
    </div>
  );
};

export default DebugGraphV2;
