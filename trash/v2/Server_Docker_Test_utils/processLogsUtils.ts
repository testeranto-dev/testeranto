import type { Server_Graph } from "../Server_Graph";

export function getProcessLogsUtil(
    processId: string,
    graphManager: Server_Graph
): string[] {
    console.log(`[processLogsUtils] Getting log URLs for process ${processId}`);

    if (!graphManager) {
        throw new Error('Graph manager not available');
    }

    const graph = graphManager.getGraphData();

    // Find the process node
    const processNode = graph.nodes.find((node: any) => node.id === processId);
    if (!processNode) {
        throw new Error(`Process ${processId} not found in graph`);
    }

    // Find all file nodes connected to this process
    const connectedEdges = graph.edges.filter((edge: any) =>
        edge.source === processId
    );

    const logUrls: string[] = [];

    for (const edge of connectedEdges) {
        const fileNode = graph.nodes.find((node: any) => node.id === edge.target);
        if (fileNode && fileNode.type === 'file') {
            const metadata = fileNode.metadata || {};
            const url = metadata.url || `file://${metadata.filePath || metadata.localPath}`;

            if (url) {
                logUrls.push(url);
            }
        }
    }

    // If no URLs found, return the process metadata
    if (logUrls.length === 0) {
        const metadata = processNode.metadata || {};
        logUrls.push(
            `Process: ${processId}`,
            `Type: ${processNode.type}`,
            `Status: ${metadata.status || 'unknown'}`,
            `Container: ${metadata.containerId || 'none'}`,
            `Service: ${metadata.serviceName || 'none'}`,
            `No log files connected in graph`
        );
    }

    return logUrls;
}
