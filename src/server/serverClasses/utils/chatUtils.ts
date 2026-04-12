import type { GraphManager } from "../../graph";

export function addChatMessageUtil(
    graphManager: GraphManager,
    agentName: string,
    content: string
): void {
    console.log(`[chatUtils] addChatMessageUtil called for ${agentName}`);
    try {
        if (!graphManager) {
            console.error(`[chatUtils] graphManager is undefined!`);
            return;
        }

        console.log(`[chatUtils] graphManager type: ${typeof graphManager}`);
        console.log(`[chatUtils] graphManager.applyUpdate exists: ${typeof graphManager.applyUpdate}`);

        const messageId = `chat_message:${agentName}:${Date.now()}`;
        const timestamp = new Date().toISOString();

        const chatNodeAttributes: any = {
            id: messageId,
            type: 'chat_message',
            label: `Chat from ${agentName}`,
            description: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            agentName: agentName,
            content: content,
            timestamp: timestamp,
            metadata: {
                frontmatter: {
                    title: `Chat from ${agentName}`,
                    type: 'chat_message',
                    agent: agentName
                }
            }
        };

        console.log(`[chatUtils] Creating chat message node: ${messageId}`);

        // Create operations to add the chat message node
        const operations: any[] = [
            {
                type: 'addNode',
                data: chatNodeAttributes,
                timestamp: timestamp
            }
        ];

        // Connect the chat message to the agent node
        const agentNodeId = `agent:${agentName}`;
        console.log(`[chatUtils] Agent node ID: ${agentNodeId}`);

        // Add edge from agent to chat message
        operations.push({
            type: 'addEdge',
            data: {
                source: agentNodeId,
                target: messageId,
                attributes: {
                    type: 'hasAgent',
                    timestamp: timestamp,
                    directed: true
                }
            },
            timestamp: timestamp
        });

        // Add edge from chat message to agent
        operations.push({
            type: 'addEdge',
            data: {
                source: messageId,
                target: agentNodeId,
                attributes: {
                    type: 'agentOf',
                    timestamp: timestamp,
                    directed: true
                }
            },
            timestamp: timestamp
        });

        // Apply the update to the graph
        const update = {
            operations: operations,
            timestamp: timestamp
        };

        console.log(`[chatUtils] Applying update with ${operations.length} operations to graph`);
        const result = graphManager.applyUpdate(update);
        console.log(`[chatUtils] Graph update applied successfully`);

        console.log(`[chatUtils] Successfully added chat message from ${agentName} to graph`);

    } catch (error: any) {
        console.error(`[chatUtils] Error adding chat message for ${agentName}:`, error);
        console.error(`[chatUtils] Error stack:`, error.stack);
    }
}
