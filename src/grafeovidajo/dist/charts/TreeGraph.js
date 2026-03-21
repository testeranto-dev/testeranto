// charts/TreeGraph.tsx
import React2 from "react";

// charts/BaseChart.tsx
import React, { useMemo } from "react";

// core/projection.ts
function projectGraph(graph, config) {
  const nodes = [];
  const edges = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const node of graph.nodes) {
    const x = getProjectedValue(node, config.xAttribute, config.xType, config.xTransform);
    const y = getProjectedValue(node, config.yAttribute, config.yType, config.yTransform);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    nodes.push({
      ...node,
      x,
      y
    });
  }
  if (graph.edges) {
    for (const edge of graph.edges) {
      edges.push({
        ...edge
      });
    }
  }
  return {
    nodes,
    edges: edges.length > 0 ? edges : void 0,
    bounds: {
      x: [minX, maxX],
      y: [minY, maxY]
    }
  };
}
function getProjectedValue(node, attribute, type, transform) {
  if (!attribute) return 0.5;
  const value = node.attributes[attribute];
  if (transform) {
    return transform(value);
  }
  switch (type) {
    case "continuous":
      return typeof value === "number" ? value : 0;
    case "categorical":
      return typeof value === "string" ? value.charCodeAt(0) % 10 / 10 : 0;
    case "ordinal":
      return typeof value === "number" ? value : 0;
    case "temporal":
      return value instanceof Date ? value.getTime() : 0;
    default:
      return typeof value === "number" ? value : 0.5;
  }
}

// core/styling.ts
function applyStyles(projectedGraph, styleConfig = {}) {
  const styledNodes = projectedGraph.nodes.map((node) => {
    const size = getNodeSize(node, styleConfig.nodeSize);
    const color = getNodeColor(node, styleConfig.nodeColor);
    const shape = getNodeShape(node, styleConfig.nodeShape);
    const label = getNodeLabel(node, styleConfig.labels);
    return {
      ...node,
      size,
      color,
      shape,
      label
    };
  });
  return {
    ...projectedGraph,
    nodes: styledNodes
  };
}
function getNodeSize(node, sizeConfig) {
  if (typeof sizeConfig === "function") {
    return sizeConfig(node);
  }
  return sizeConfig || 10;
}
function getNodeColor(node, colorConfig) {
  if (typeof colorConfig === "function") {
    return colorConfig(node);
  }
  return colorConfig || "#3498db";
}
function getNodeShape(node, shapeConfig) {
  if (typeof shapeConfig === "function") {
    return shapeConfig(node);
  }
  return shapeConfig || "circle";
}
function getNodeLabel(node, labelsConfig) {
  if (!labelsConfig?.show) return void 0;
  const attribute = labelsConfig.attribute || "id";
  return node.attributes[attribute] || node.id;
}

// core/layout.ts
function layoutGrid(nodes, spacing = { x: 50, y: 50 }) {
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });
  return sortedNodes.map((node, index) => ({
    ...node,
    screenX: index * spacing.x,
    screenY: Math.floor(index / 10) * spacing.y
  }));
}
function layoutForce(nodes, edges) {
  return nodes.map((node) => ({
    ...node,
    screenX: node.x * 100,
    screenY: node.y * 100
  }));
}
function layoutTree(nodes, edges, rootId) {
  const root = rootId ? nodes.find((n) => n.id === rootId) : nodes[0];
  return nodes.map((node, index) => ({
    ...node,
    screenX: index * 60,
    screenY: getDepth(node, edges, nodes) * 80
  }));
}
function getDepth(node, edges, allNodes) {
  const incomingEdges = edges.filter((e) => e.target === node.id);
  if (incomingEdges.length === 0) return 0;
  const sourceNodes = incomingEdges.map((e) => allNodes.find((n) => n.id === e.source));
  const maxDepth = Math.max(...sourceNodes.map((n) => getDepth(n, edges, allNodes)));
  return maxDepth + 1;
}
function layoutTimeline(nodes, timeAttribute) {
  const timeNodes = nodes.map((node) => ({
    node,
    time: node.attributes[timeAttribute]
  })).sort((a, b) => a.time - b.time);
  return timeNodes.map(({ node }, index) => ({
    ...node,
    screenX: index * 80,
    screenY: 50
  }));
}

// charts/BaseChart.tsx
var BaseChart = ({
  data,
  config,
  width,
  height,
  onNodeClick,
  onNodeHover
}) => {
  const projectedGraph = useMemo(() => {
    return projectGraph(data, config.projection);
  }, [data, config.projection]);
  const laidOutGraph = useMemo(() => {
    const nodes = projectedGraph.nodes;
    let laidOutNodes = [...nodes];
    switch (config.projection.layout) {
      case "grid":
        laidOutNodes = layoutGrid(nodes, config.projection.spacing);
        break;
      case "force":
        laidOutNodes = layoutForce(nodes, data.edges);
        break;
      case "tree":
        if (data.edges) {
          laidOutNodes = layoutTree(nodes, data.edges);
        }
        break;
      case "timeline":
        if (config.projection.xAttribute) {
          laidOutNodes = layoutTimeline(nodes, config.projection.xAttribute);
        }
        break;
      default:
        laidOutNodes = nodes.map((node) => ({
          ...node,
          screenX: node.x * width,
          screenY: node.y * height
        }));
    }
    return {
      ...projectedGraph,
      nodes: laidOutNodes
    };
  }, [projectedGraph, config.projection.layout, data.edges, width, height]);
  const styledGraph = useMemo(() => {
    return applyStyles(laidOutGraph, config.style);
  }, [laidOutGraph, config.style]);
  const renderNodes = () => {
    return styledGraph.nodes.map((node) => {
      const x = node.screenX || node.x * width;
      const y = node.screenY || node.y * height;
      const nodeProps = {
        key: node.id,
        cx: x,
        cy: y,
        r: node.size,
        fill: node.color,
        onClick: () => onNodeClick?.(node),
        onMouseEnter: () => onNodeHover?.(node),
        onMouseLeave: () => onNodeHover?.(null),
        style: { cursor: "pointer" }
      };
      switch (node.shape) {
        case "square":
          return /* @__PURE__ */ React.createElement(
            "rect",
            {
              ...nodeProps,
              x: x - node.size,
              y: y - node.size,
              width: node.size * 2,
              height: node.size * 2
            }
          );
        case "diamond":
          return /* @__PURE__ */ React.createElement(
            "polygon",
            {
              ...nodeProps,
              points: `${x},${y - node.size} ${x + node.size},${y} ${x},${y + node.size} ${x - node.size},${y}`
            }
          );
        default:
          return /* @__PURE__ */ React.createElement("circle", { ...nodeProps });
      }
    });
  };
  const renderEdges = () => {
    if (!styledGraph.edges) return null;
    return styledGraph.edges.map((edge, index) => {
      const sourceNode = styledGraph.nodes.find((n) => n.id === edge.source);
      const targetNode = styledGraph.nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) return null;
      const x1 = sourceNode.screenX || sourceNode.x * width;
      const y1 = sourceNode.screenY || sourceNode.y * height;
      const x2 = targetNode.screenX || targetNode.x * width;
      const y2 = targetNode.screenY || targetNode.y * height;
      return /* @__PURE__ */ React.createElement(
        "line",
        {
          key: `edge-${index}`,
          x1,
          y1,
          x2,
          y2,
          stroke: config.style?.edgeColor || "#999",
          strokeWidth: config.style?.edgeWidth || 1
        }
      );
    });
  };
  const renderLabels = () => {
    if (!config.style?.labels?.show) return null;
    return styledGraph.nodes.map((node) => {
      if (!node.label) return null;
      const x = node.screenX || node.x * width;
      const y = node.screenY || node.y * height;
      return /* @__PURE__ */ React.createElement(
        "text",
        {
          key: `label-${node.id}`,
          x,
          y: y + node.size + 15,
          textAnchor: "middle",
          fontSize: config.style.labels?.fontSize || 12,
          fill: "#333"
        },
        node.label
      );
    });
  };
  return /* @__PURE__ */ React.createElement("svg", { width, height, style: { border: "1px solid #ccc" } }, renderEdges(), renderNodes(), renderLabels());
};

// charts/TreeGraph.tsx
var TreeGraph = (props) => {
  return /* @__PURE__ */ React2.createElement(BaseChart, { ...props });
};
export {
  TreeGraph
};
