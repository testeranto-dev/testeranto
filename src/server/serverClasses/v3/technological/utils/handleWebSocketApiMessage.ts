import { matchWsMessageToApi } from "../../utils/api/matchWsMessageToApi";

export async function handleWebSocketApiMessage(
  client: any,
  message: any,
  registeredWsHandlers: Map<string, (message: any, client: any) => Promise<any>>,
  sendToClient: (clientId: string, data: any) => void,
  logBusinessError: (message: string, error: any) => void,
): Promise<void> {
  try {
    const parsedMessage = typeof message === "string" ? JSON.parse(message) : message;

    if (!parsedMessage.type) {
      sendToClient(client.id, {
        type: "error",
        timestamp: new Date().toISOString(),
        message: "WebSocket message must have a type field",
      });
      return;
    }

    const messageKey = matchWsMessageToApi(parsedMessage.type);
    if (!messageKey) {
      sendToClient(client.id, {
        type: "error",
        timestamp: new Date().toISOString(),
        message: `Unknown WebSocket message type: ${parsedMessage.type}`,
      });
      return;
    }

    const handler = registeredWsHandlers.get(messageKey);
    if (!handler) {
      sendToClient(client.id, {
        type: "error",
        timestamp: new Date().toISOString(),
        message: `No handler registered for message type: ${parsedMessage.type}`,
      });
      return;
    }

    const result = await handler(parsedMessage, client);

    if (result) {
      const response = {
        type: `${parsedMessage.type}_response`,
        timestamp: new Date().toISOString(),
        ...result,
      };
      sendToClient(client.id, response);
    }
  } catch (error: any) {
    logBusinessError("Error handling WebSocket API message:", error);
    sendToClient(client.id, {
      type: "error",
      timestamp: new Date().toISOString(),
      message: "Error processing message",
      error: error.message,
    });
  }
}