import { type GraphData, type GraphOperation } from '../../graph/index';

// Pure function to clean up attribute nodes
export function cleanupAttributeNodesPure(
  graphData: GraphData,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];

  // List of attribute suffixes that should not be separate nodes
  const attributeSuffixes = [
    'file', 'filePath', 'relativePath', 'result', 'content', 'configKey',
    'testName', 'size', 'isJson', 'modified'
  ];

  // Get all nodes from graphData
  const nodes = graphData.nodes.map(node => node.id);
  const nodeAttributes = new Map(
    graphData.nodes.map(node => [node.id, node])
  );

  for (const nodeId of nodes) {
    const attributes = nodeAttributes.get(nodeId);
    if (!attributes) continue;

    // Check if this is an attribute node by ID pattern
    const parts = nodeId.split(':');

    // Handle both cases: parts.length >= 3 (e.g., suite:14:content) 
    // and parts.length == 2 where second part is an attribute suffix (e.g., entrypoint:testName)
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      if (attributeSuffixes.includes(lastPart)) {
        // This is an attribute node that should be removed
        // For parts.length == 2, we need to find the parent node differently
        let parentId: string | null = null;

        if (parts.length >= 3) {
          // Pattern like suite:14:content -> parent is suite:14
          parentId = parts.slice(0, -1).join(':');
        } else if (parts.length === 2) {
          // Pattern like entrypoint:testName -> parent is the actual entrypoint
          // We need to find the actual entrypoint node
          // Look for nodes with type 'entrypoint' that don't have attribute suffixes
          const entrypointNodes = nodes.filter(n => {
            const attrs = nodeAttributes.get(n);
            return attrs?.type === 'entrypoint' &&
              !attributeSuffixes.includes(n.split(':').pop() || '');
          });

          // If there's exactly one entrypoint node, use it
          // Otherwise, we can't determine the parent
          if (entrypointNodes.length === 1) {
            parentId = entrypointNodes[0];
          } else {
            // Try to find by prefix
            const prefix = parts[0] + ':';
            const potentialParents = nodes.filter(n =>
              n.startsWith(prefix) &&
              !attributeSuffixes.includes(n.split(':').pop() || '')
            );
            if (potentialParents.length === 1) {
              parentId = potentialParents[0];
            }
          }
        }

        if (parentId && nodeAttributes.has(parentId)) {
          // Get the parent node's attributes
          const parentAttributes = nodeAttributes.get(parentId)!;

          // Extract the attribute value from various possible fields
          const attrValue = attributes.label || attributes.value ||
            attributes.content || attributes.result ||
            attributes.attributes?.label ||
            attributes.attributes?.value;

          if (attrValue !== undefined) {
            // Update the parent node's metadata with this attribute
            const updatedMetadata = {
              ...parentAttributes.metadata,
              [lastPart]: attrValue
            };

            // Update the parent node
            operations.push({
              type: 'updateNode',
              data: {
                id: parentId,
                metadata: updatedMetadata
              },
              timestamp
            });
          }
        }

        // Remove the attribute node
        operations.push({
          type: 'removeNode',
          data: { id: nodeId },
          timestamp
        });
      }
    }
    // Also check by node type
    else if (attributes.type === 'attribute') {
      // Remove any node explicitly marked as type 'attribute'
      operations.push({
        type: 'removeNode',
        data: { id: nodeId },
        timestamp
      });
    }
  }

  return operations;
}
