export interface ChatMessage {
    id: string;
    agent: string;
    content: string;
    timestamp: string;
    type: 'user' | 'agent';
}

export function createChatMessage(
    agentName: string,
    content: string,
    type: 'user' | 'agent' = 'agent'
): ChatMessage {
    return {
        id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agent: agentName,
        content: content,
        timestamp: new Date().toISOString(),
        type: type
    };
}

export function handleSendChatMessageUtil(
    agentName: string,
    content: string,
    broadcastChatMessage: (message: ChatMessage) => void
): ChatMessage {
    const chatMessage = createChatMessage(agentName, content, 'user');
    broadcastChatMessage(chatMessage);
    return chatMessage;
}

export function handleGetChatHistoryUtil(
    agentName: string,
    limit: number = 50
): ChatMessage[] {
    // This is a placeholder - in a real implementation, you would fetch from a database
    console.log(`[wsChatUtils] Getting chat history for ${agentName}, limit: ${limit}`);
    return [];
}
