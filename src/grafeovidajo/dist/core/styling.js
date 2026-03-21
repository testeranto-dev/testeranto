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
export {
  applyStyles
};
