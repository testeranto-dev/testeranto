export function getProcessNode(
  nodes: any[],
  nodeId: string,
): any | null {
  return nodes.find(n => n.id === nodeId) || null;
}
