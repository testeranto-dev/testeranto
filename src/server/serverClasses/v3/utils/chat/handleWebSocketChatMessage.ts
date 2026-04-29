export interface WebSocketChatMessage {
  agentName: string;
  content: string;
  clientId?: string;
}

export interface HandleWebSocketChatMessageResult {
  messageId: string;
  agentName: string;
  content: string;
  timestamp: string;
}

// export function handleWebSocketChatMessage(message: WebSocketChatMessage): HandleWebSocketChatMessageResult {
//   const messageId = `chat-ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//   const timestamp = new Date().toISOString();

//   return {
//     messageId,
//     agentName: message.agentName,
//     content: message.content,
//     timestamp,
//   };
// }
