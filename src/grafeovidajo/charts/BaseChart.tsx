import React, { useMemo, useState, useRef, useEffect } from 'react';
import { GraphData, VizConfig, VizComponentProps } from '../core/types';
import { projectGraph } from '../core/projection';
import { applyStyles } from '../core/styling';
import { layoutGrid, layoutTree, layoutTimeline, layoutForce } from '../core/layout';
import { Palette } from '../../colors';

// Define TreeConfig interface locally since we need it for type checking
interface TreeConfig extends VizConfig {
  rootId?: string;
  orientation?: 'horizontal' | 'vertical';
  nodeSeparation?: number;
  levelSeparation?: number;
}

export const BaseChart: React.FC<VizComponentProps> = (props) => {
  // Destructure props inside the component
  const { data, config, width, height, onNodeClick, onNodeHover, onNodeUpdate } = props;

  // Camera state
  const [camera, setCamera] = useState({
    x: 0,
    y: 0,
    scale: 1
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Project the graph data
  const projectedGraph = projectGraph(data, config.projection);

  // Apply layout
  const nodes = projectedGraph.nodes;
  let laidOutNodes = [...nodes];

  switch (config.projection.layout) {
    case 'grid':
      laidOutNodes = layoutGrid(nodes, config.projection.spacing);
      break;
    case 'force':
      // Use d3-force for proper force-directed layout
      laidOutNodes = layoutForce(
        nodes,
        data.edges,
        {
          width,
          height,
          strength: config.projection.repulsionStrength,
          distance: config.projection.distance,
          iterations: config.projection.iterations
        }
      );
      // Ensure all nodes have screen coordinates
      laidOutNodes = laidOutNodes.map(node => ({
        ...node,
        screenX: node.screenX || node.x * width,
        screenY: node.screenY || node.y * height
      }));
      break;
    case 'tree':
      if (data.edges) {
        // Cast config to TreeConfig to access tree-specific properties
        const treeConfig = config as TreeConfig;
        laidOutNodes = layoutTree(
          nodes,
          data.edges,
          treeConfig.rootId,
          treeConfig.orientation,
          treeConfig.nodeSeparation,
          treeConfig.levelSeparation
        );
      }
      break;
    case 'timeline':
      if (config.projection.xAttribute) {
        laidOutNodes = layoutTimeline(nodes, config.projection.xAttribute);
      }
      break;
    default:
      // No layout - use projected coordinates directly
      laidOutNodes = nodes.map(node => ({
        ...node,
        screenX: node.x * width,
        screenY: node.y * height
      }));
  }

  const laidOutGraph = {
    ...projectedGraph,
    nodes: laidOutNodes
  };

  // Apply styles
  const styledGraph = applyStyles(laidOutGraph, config.style);

  // Calculate bounds for camera constraints
  const bounds = useMemo(() => {
    if (styledGraph.nodes.length === 0) {
      return { minX: 0, maxX: width, minY: 0, maxY: height };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    styledGraph.nodes.forEach(node => {
      const x = node.screenX || node.x * width;
      const y = node.screenY || node.y * height;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    // Add padding
    const padding = 50;
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding
    };
  }, [styledGraph.nodes, width, height]);

  // Handle space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scrolling
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || (e.button === 0 && spacePressed)) { // Middle click or Left click with Space
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setCamera(prev => ({
        ...prev,
        x: prev.x + dx / prev.scale,
        y: prev.y + dy / prev.scale
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();

    // Get mouse position relative to SVG
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate mouse position in graph coordinates
    const graphX = (mouseX - camera.x) / camera.scale;
    const graphY = (mouseY - camera.y) / camera.scale;

    // Calculate new scale
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, camera.scale * delta));

    // Adjust camera position to zoom towards mouse
    const newX = mouseX - graphX * newScale;
    const newY = mouseY - graphY * newScale;

    setCamera({
      x: newX,
      y: newY,
      scale: newScale
    });
  };

  // Reset camera to fit all nodes
  const resetCamera = () => {
    const graphWidth = bounds.maxX - bounds.minX;
    const graphHeight = bounds.maxY - bounds.minY;

    if (graphWidth === 0 || graphHeight === 0) return;

    // Calculate scale to fit graph in viewport
    const scaleX = width / graphWidth;
    const scaleY = height / graphHeight;
    const scale = Math.min(scaleX, scaleY) * 0.8; // 80% padding

    // Center the graph
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const x = width / 2 - centerX * scale;
    const y = height / 2 - centerY * scale;

    setCamera({ x, y, scale });
  };

  // Reset camera when data changes
  useEffect(() => {
    resetCamera();
  }, [data, width, height]);

  // Convert graph coordinates to screen coordinates
  const toScreenCoords = (x: number, y: number) => {
    return {
      x: x * camera.scale + camera.x,
      y: y * camera.scale + camera.y
    };
  };

  // Render nodes
  const renderNodes = () => {
    return styledGraph.nodes.map((node) => {
      const graphX = node.screenX || node.x * width;
      const graphY = node.screenY || node.y * height;
      const screenCoords = toScreenCoords(graphX, graphY);
      const screenSize = node.size * camera.scale;

      const nodeProps = {
        key: node.id,
        onClick: () => onNodeClick?.(node),
        onMouseEnter: () => onNodeHover?.(node),
        onMouseLeave: () => onNodeHover?.(null),
        style: { cursor: 'pointer' }
      };

      // Get icon from node or attributes
      const icon = node.icon || node.attributes?.icon;
      let iconElement = null;
      
      if (icon) {
        // Map icon names to emoji
        const iconEmojiMap: Record<string, string> = {
          'document': '📄',
          'folder': '📁',
          'globe': '🌐',
          'file-text': '📝',
          'test': '🧪',
          'circle': '⭕',
          'play': '▶️',
          'check': '✅'
        };
        const emoji = iconEmojiMap[icon] || '❓';
        iconElement = (
          <text
            x={screenCoords.x}
            y={screenCoords.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={screenSize * 1.5}
            fill="#333"
            style={{ pointerEvents: 'none' }}
          >
            {emoji}
          </text>
        );
      }

      let shapeElement;
      switch (node.shape) {
        case 'square':
          shapeElement = (
            <rect
              {...nodeProps}
              x={screenCoords.x - screenSize}
              y={screenCoords.y - screenSize}
              width={screenSize * 2}
              height={screenSize * 2}
              fill={node.color}
              opacity={icon ? 0.3 : 1}
            />
          );
          break;
        case 'diamond':
          shapeElement = (
            <polygon
              {...nodeProps}
              points={`
                ${screenCoords.x},${screenCoords.y - screenSize}
                ${screenCoords.x + screenSize},${screenCoords.y}
                ${screenCoords.x},${screenCoords.y + screenSize}
                ${screenCoords.x - screenSize},${screenCoords.y}
              `}
              fill={node.color}
              opacity={icon ? 0.3 : 1}
            />
          );
          break;
        default: // circle
          shapeElement = (
            <circle
              {...nodeProps}
              cx={screenCoords.x}
              cy={screenCoords.y}
              r={screenSize}
              fill={node.color}
              opacity={icon ? 0.3 : 1}
            />
          );
      }

      return (
        <g key={node.id}>
          {shapeElement}
          {iconElement}
        </g>
      );
    });
  };

  // Render edges
  const renderEdges = () => {
    if (!styledGraph.edges) return null;

    return styledGraph.edges.map((edge, index) => {
      const sourceNode = styledGraph.nodes.find(n => n.id === edge.source);
      const targetNode = styledGraph.nodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) return null;

      const sourceX = sourceNode.screenX || sourceNode.x * width;
      const sourceY = sourceNode.screenY || sourceNode.y * height;
      const targetX = targetNode.screenX || targetNode.x * width;
      const targetY = targetNode.screenY || targetNode.y * height;

      const sourceScreen = toScreenCoords(sourceX, sourceY);
      const targetScreen = toScreenCoords(targetX, targetY);

      return (
        <line
          key={`edge-${index}`}
          x1={sourceScreen.x}
          y1={sourceScreen.y}
          x2={targetScreen.x}
          y2={targetScreen.y}
          stroke={config.style?.edgeColor || '#999'}
          strokeWidth={(config.style?.edgeWidth || 1) * camera.scale}
        />
      );
    });
  };

  // Render labels
  const renderLabels = () => {
    if (!config.style?.labels?.show) return null;

    return styledGraph.nodes.map((node) => {
      if (!node.label) return null;

      const graphX = node.screenX || node.x * width;
      const graphY = node.screenY || node.y * height;
      const screenCoords = toScreenCoords(graphX, graphY);
      const screenSize = node.size * camera.scale;

      return (
        <text
          key={`label-${node.id}`}
          x={screenCoords.x}
          y={screenCoords.y + screenSize + 15}
          textAnchor="middle"
          fontSize={(config.style.labels?.fontSize || 12) * camera.scale}
          fill="#333"
        >
          {node.label}
        </text>
      );
    });
  };

  // Render space indicator
  const renderSpaceIndicator = () => {
    if (!spacePressed) return null;

    return (
      <g>
        <rect
          x={10}
          y={50}
          width={120}
          height={25}
          rx={5}
          fill={Palette.rustSubtle}
          stroke={Palette.rust}
          strokeWidth={1}
        />
        <text
          x={70}
          y={66}
          textAnchor="middle"
          fill={Palette.rust}
          fontSize={11}
          fontWeight="bold"
        >
          Space: Pan Mode
        </text>
      </g>
    );
  };

  // Render camera controls
  const renderCameraControls = () => {
    return (
      <g>
        {/* Reset camera button */}
        <rect
          x={10}
          y={10}
          width={100}
          height={30}
          rx={5}
          fill={Palette.rust}
          onClick={resetCamera}
          style={{ cursor: 'pointer' }}
        />
        <text
          x={60}
          y={28}
          textAnchor="middle"
          fill="white"
          fontSize={12}
          onClick={resetCamera}
          style={{ cursor: 'pointer' }}
        >
          Reset View
        </text>

        {/* Space indicator */}
        {renderSpaceIndicator()}

        {/* Camera info */}
        <text
          x={width - 10}
          y={20}
          textAnchor="end"
          fill="#666"
          fontSize={11}
        >
          Scale: {camera.scale.toFixed(2)}x
        </text>
        <text
          x={width - 10}
          y={35}
          textAnchor="end"
          fill="#666"
          fontSize={11}
        >
          Pan: Space+Click or Middle Click
        </text>
        <text
          x={width - 10}
          y={50}
          textAnchor="end"
          fill="#666"
          fontSize={11}
        >
          Zoom: Mouse Wheel
        </text>
      </g>
    );
  };

  // Determine cursor style based on space bar and dragging state
  const cursorStyle = isDragging ? 'grabbing' : (spacePressed ? 'grab' : 'default');

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ccc', cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Background grid */}
        <defs>
          <pattern
            id="grid"
            width={50 * camera.scale}
            height={50 * camera.scale}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${50 * camera.scale} 0 L 0 0 0 ${50 * camera.scale}`}
              fill="none"
              stroke="#e0e0e0"
              strokeWidth={1}
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#grid)"
        />

        {/* Graph content */}
        <g>
          {renderEdges()}
          {renderNodes()}
          {renderLabels()}
        </g>

        {/* Camera controls */}
        {renderCameraControls()}
      </svg>
    </div>
  );
};
