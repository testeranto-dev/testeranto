import type { GraphUpdate } from "../../../graph";

export function addChatMessageUtil(
    agentName: string,
    content: string,
    timestamp: string
): GraphUpdate {
    const messageId = `chat_message:${agentName}:${Date.now()}`;

    const chatNodeAttributes = {
        id: messageId,
        type: {
            category: 'chat' as const,
            type: 'chat_message' as const
        },
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

    const agentNodeId = `agent:${agentName}`;

    const operations = [
        {
            type: 'addNode' as const,
            data: chatNodeAttributes,
            timestamp: timestamp
        },
        {
            type: 'addEdge' as const,
            data: {
                source: agentNodeId,
                target: messageId,
                attributes: {
                    type: {
                        category: 'ownership' as const,
                        type: 'has' as const,
                        directed: true
                    },
                    timestamp: timestamp
                }
            },
            timestamp: timestamp
        },
        {
            type: 'addEdge' as const,
            data: {
                source: messageId,
                target: agentNodeId,
                attributes: {
                    type: {
                        category: 'ownership' as const,
                        type: 'belongsTo' as const,
                        directed: true
                    },
                    timestamp: timestamp
                }
            },
            timestamp: timestamp
        }
    ];

    return {
        operations,
        timestamp
    };
}
