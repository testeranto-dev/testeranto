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
export {
  projectGraph
};
