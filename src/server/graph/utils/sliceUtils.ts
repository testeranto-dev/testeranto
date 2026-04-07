import type { GraphNodeAttributes, GraphEdgeAttributes } from '../../../graph/index';
import type { TesterantoGraph } from '../../../graph/index';

export function getFilesAndFoldersSlice(
    graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
} {
    const nodes: GraphNodeAttributes[] = [];
    const edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }> = [];

    // Collect all file and folder nodes
    graph.forEachNode((nodeId, attributes) => {
        if (attributes.type === 'file' || attributes.type === 'folder') {
            nodes.push({ ...attributes, id: nodeId });
        }
    });

    // Collect edges where both source and target are file or folder nodes
    graph.forEachEdge((edgeId, attributes, source, target) => {
        const sourceAttrs = graph.getNodeAttributes(source);
        const targetAttrs = graph.getNodeAttributes(target);

        // Only include edges where both ends are files or folders
        if ((sourceAttrs.type === 'file' || sourceAttrs.type === 'folder') &&
            (targetAttrs.type === 'file' || targetAttrs.type === 'folder')) {
            edges.push({
                source,
                target,
                attributes: { ...attributes }
            });
        }
    });

    return { nodes, edges };
}

export function getProcessSlice(
    graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
} {
    const nodes: GraphNodeAttributes[] = [];
    const edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }> = [];

    // Collect all process-related nodes
    const processTypes = ['docker_process', 'bdd_process', 'check_process', 'aider_process', 'builder_process'];

    graph.forEachNode((nodeId, attributes) => {
        if (processTypes.includes(attributes.type)) {
            nodes.push({ ...attributes, id: nodeId });
        }
    });

    // Collect edges where at least one end is a process node
    graph.forEachEdge((edgeId, attributes, source, target) => {
        const sourceAttrs = graph.getNodeAttributes(source);
        const targetAttrs = graph.getNodeAttributes(target);

        // Include edges where source or target is a process node
        if (processTypes.includes(sourceAttrs.type) || processTypes.includes(targetAttrs.type)) {
            edges.push({
                source,
                target,
                attributes: { ...attributes }
            });
        }
    });

    return { nodes, edges };
}

export function getAiderSlice(
    graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
} {
    const nodes: GraphNodeAttributes[] = [];
    const edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }> = [];

    // Collect all aider-related nodes and agent nodes
    const aiderTypes = ['aider', 'aider_process', 'agent'];

    graph.forEachNode((nodeId, attributes) => {
        if (aiderTypes.includes(attributes.type)) {
            nodes.push({ ...attributes, id: nodeId });
        }
    });

    // Collect edges where at least one end is an aider or agent node
    graph.forEachEdge((edgeId, attributes, source, target) => {
        const sourceAttrs = graph.getNodeAttributes(source);
        const targetAttrs = graph.getNodeAttributes(target);

        // Include edges where source or target is an aider or agent node
        if (aiderTypes.includes(sourceAttrs.type) || aiderTypes.includes(targetAttrs.type)) {
            edges.push({
                source,
                target,
                attributes: { ...attributes }
            });
        }
    });

    return { nodes, edges };
}

export function getRuntimeSlice(
    graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>
): {
    nodes: GraphNodeAttributes[],
    edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }>
} {
    const nodes: GraphNodeAttributes[] = [];
    const edges: Array<{ source: string; target: string; attributes: GraphEdgeAttributes }> = [];

    // Collect runtime-related nodes (config nodes with runtime information)
    graph.forEachNode((nodeId, attributes) => {
        // Look for nodes that have runtime information in metadata
        if (attributes.type === 'config' ||
            (attributes.metadata && attributes.metadata.runtime)) {
            nodes.push({ ...attributes, id: nodeId });
        }
    });

    // Also include entrypoint nodes that are associated with runtimes
    graph.forEachNode((nodeId, attributes) => {
        if (attributes.type === 'entrypoint' &&
            attributes.metadata &&
            attributes.metadata.runtime) {
            nodes.push({ ...attributes, id: nodeId });
        }
    });

    // Collect edges where at least one end is a runtime-related node
    graph.forEachEdge((edgeId, attributes, source, target) => {
        const sourceAttrs = graph.getNodeAttributes(source);
        const targetAttrs = graph.getNodeAttributes(target);

        // Check if source or target is in our collected nodes
        const sourceInSlice = nodes.some(n => n.id === source);
        const targetInSlice = nodes.some(n => n.id === target);

        if (sourceInSlice || targetInSlice) {
            edges.push({
                source,
                target,
                attributes: { ...attributes }
            });
        }
    });

    return { nodes, edges };
}
