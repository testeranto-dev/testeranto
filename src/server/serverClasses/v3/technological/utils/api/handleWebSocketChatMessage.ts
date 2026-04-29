export async function handleWebSocketChatMessage(
  client: any,
  message: any,
  addNode: (node: any) => void,
  updateAllAgentSliceFiles: () => void,
  broadcastApiMessage: (messageType: string, data: any) => void,
  sendToClient: (clientId: string, data: any) => void,
  broadcastToChannel: (channel: string, data: any) => void,
  logBusinessError: (message: string, error: any) => void,
): Promise<void> {
  try {
    const { sender, content } = message;

    if (!sender || !content) {
      sendToClient(client.id, {
        type: "error",
        timestamp: new Date().toISOString(),
        message: "Missing required fields: sender and content",
      });
      return;
    }

    const messageId = `chat-ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const chatNode = {
      id: messageId,
      type: { category: "chat", type: "chat_message" },
      label: `Chat message from ${sender}`,
      description: content,
      metadata: {
        sender,
        content,
        timestamp: new Date().toISOString(),
        via: "websocket",
      },
      timestamp: new Date().toISOString(),
    };

    addNode(chatNode);
    updateAllAgentSliceFiles();

    broadcastApiMessage("resourceChanged", {
      url: "/~/chat",
      message: "New chat message added via WebSocket",
      timestamp: new Date().toISOString(),
    });

    sendToClient(client.id, {
      type: "chatMessageSent",
      messageId,
      timestamp: new Date().toISOString(),
      message: "Chat message sent successfully",
    });

    broadcastToChannel("chat", {
      type: "newChatMessage",
      messageId,
      sender,
      content,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logBusinessError("Error handling WebSocket chat message:", error);
    sendToClient(client.id, {
      type: "error",
      timestamp: new Date().toISOString(),
      message: "Failed to send chat message",
      error: error.message,
    });
  }
}