import type { GraphData } from "grafeovidajo";
import type { GraphNodeType, GraphEdgeType } from ".";

// Convert from grafeovidajo's GraphData format to our GraphData
export function fromGrafeovidajoGraphData(
  data: {
    nodes: Array<{ id: string; attributes: Record<string, any> }>;
    edges?: Array<{ source: string; target: string; attributes?: Record<string, any> }>
  }
): GraphData {
  // First, separate attribute nodes from regular nodes
  const attributeNodes = new Map<string, { id: string; attributes: Record<string, any> }>();
  const regularNodes: Array<{ id: string; attributes: Record<string, any> }> = [];

  // List of attribute suffixes that should not be separate nodes
  const attributeSuffixes = [
    'file', 'filePath', 'relativePath', 'result', 'content', 'configKey',
    'testName', 'size', 'isJson', 'modified'
  ];

  for (const node of data.nodes) {
    const parts = node.id.split(':');
    const lastPart = parts[parts.length - 1];

    // Check if this is an attribute node
    // Handle both cases: parts.length >= 3 (e.g., suite:14:content) 
    // and parts.length == 2 where second part is an attribute suffix (e.g., entrypoint:testName)
    if ((parts.length >= 3 || parts.length === 2) && attributeSuffixes.includes(lastPart)) {
      // This is an attribute node - store it to merge with its parent
      attributeNodes.set(node.id, node);
    } else {
      regularNodes.push(node);
    }
  }

  // Process regular nodes, merging attributes from their attribute nodes
  const processedNodes = regularNodes.map(node => {
    const attrs = { ...(node.attributes || {}) };

    // Find attribute nodes that belong to this node
    // Attribute nodes have IDs like parentId:attributeName
    const nodeIdPrefix = node.id + ':';

    // Also handle the case where the node itself might be a parent of attribute nodes
    // For example, if node.id is "entrypoint:actualTestName" and there's an attribute node
    // "entrypoint:testName", we need to check if they share a common prefix

    // Collect all attributes from child attribute nodes
    for (const [attrNodeId, attrNode] of attributeNodes.entries()) {
      // Check if attribute node starts with node.id + ':' (direct child)
      if (attrNodeId.startsWith(nodeIdPrefix)) {
        const attrName = attrNodeId.substring(nodeIdPrefix.length);
        const attrValue = attrNode.attributes?.label || attrNode.attributes?.value ||
          attrNode.attributes?.content || attrNode.attributes?.result;

        if (attrValue !== undefined) {
          attrs[attrName] = attrValue;
        }
      }
      // Also check for attribute nodes that might be related but don't have the exact prefix
      // For example, entrypoint:testName might belong to entrypoint:actualTestName
      else {
        const attrParts = attrNodeId.split(':');
        const nodeParts = node.id.split(':');

        // If both start with the same prefix (e.g., "entrypoint")
        if (attrParts[0] === nodeParts[0] && attrParts.length === 2 &&
          attributeSuffixes.includes(attrParts[1])) {
          // This attribute node might belong to this node
          // Check if this node is the appropriate type
          const nodeType = attrs.type || (node.id.startsWith('entrypoint:') ? 'entrypoint' :
            node.id.startsWith('suite:') ? 'suite' : 'unknown');

          if ((nodeType === 'entrypoint' && attrParts[0] === 'entrypoint') ||
            (nodeType === 'suite' && attrParts[0] === 'suite')) {
            const attrName = attrParts[1];
            const attrValue = attrNode.attributes?.label || attrNode.attributes?.value ||
              attrNode.attributes?.content || attrNode.attributes?.result;

            if (attrValue !== undefined) {
              attrs[attrName] = attrValue;
            }
          }
        }
      }
    }

    // Now determine the type
    let type: GraphNodeType;

    // Check if type is explicitly set and valid
    if (attrs.type && Object.values(graphNodeTypeValues).includes(attrs.type)) {
      type = attrs.type as GraphNodeType;
    } else {
      // Infer type from node ID prefix
      const id = node.id;

      if (id.startsWith('suite:')) {
        type = 'entrypoint'; // Treat suite as entrypoint
      } else if (id.startsWith('test:')) {
        type = 'test';
      } else if (id.startsWith('feature:')) {
        type = 'feature';
      } else if (id.startsWith('file:')) {
        type = 'file';
      } else if (id.startsWith('config:')) {
        type = 'config';
      } else if (id.startsWith('entrypoint:')) {
        type = 'entrypoint';
      } else if (id.startsWith('documentation:')) {
        type = 'documentation';
      } else if (id.startsWith('test_result:')) {
        type = 'test_result';
      } else if (id.startsWith('folder:')) {
        type = 'folder';
      } else if (id.startsWith('domain:')) {
        type = 'domain';
      } else if (id.startsWith('input_file:')) {
        type = 'input_file';
      } else {
        // Fall back to attribute-based inference
        if (attrs.configKey !== undefined || attrs.testName !== undefined) {
          type = 'test_result';
        } else if (attrs.filePath !== undefined || attrs.relativePath !== undefined) {
          type = 'file';
        } else {
          type = 'feature';
        }
      }
    }

    // Extract standard fields
    const {
      type: _,
      label,
      description,
      status,
      priority,
      timestamp,
      // Remove attribute fields that are now in metadata
      configKey,
      testName,
      filePath,
      relativePath,
      result,
      content,
      ...rest
    } = attrs;

    // Create label from ID if not provided
    let nodeLabel = label;
    if (!nodeLabel) {
      // Extract a meaningful label from the ID
      const parts = node.id.split(':');
      nodeLabel = parts[parts.length - 1] || node.id;
    }

    return {
      id: node.id,
      type,
      label: nodeLabel,
      description,
      status,
      priority,
      timestamp,
      metadata: rest
    };
  });

  // Filter edges to remove any that reference attribute nodes
  const filteredEdges = (data.edges || []).filter(edge => {
    // Check if source or target is an attribute node
    const sourceIsAttribute = attributeNodes.has(edge.source);
    const targetIsAttribute = attributeNodes.has(edge.target);

    // Keep edge only if neither endpoint is an attribute node
    return !sourceIsAttribute && !targetIsAttribute;
  }).map(edge => ({
    source: edge.source,
    target: edge.target,
    attributes: {
      type: (edge.attributes?.type as GraphEdgeType) || 'associatedWith',
      // weight: edge.attributes?.weight,
      timestamp: edge.attributes?.timestamp,
      metadata: edge.attributes?.metadata
    }
  }));

  return {
    nodes: processedNodes,
    edges: filteredEdges,
    metadata: {
      version: '1.0',
      timestamp: new Date().toISOString(),
      source: 'grafeovidajo'
    }
  };
}
