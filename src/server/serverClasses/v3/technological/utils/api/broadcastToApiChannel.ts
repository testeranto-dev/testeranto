import { wsApi } from "../../../../../../api";

export function broadcastToApiChannel(
  channel: string,
  messageType: string,
  data: any,
  broadcastToChannel: (channel: string, message: any) => void,
  logBusinessError: (message: string, error: any) => void,
): void {
  const messageSpec = wsApi[messageType as keyof typeof wsApi];
  if (!messageSpec) {
    logBusinessError(`Cannot broadcast to channel: message type '${messageType}' not found in wsApi`, new Error("Missing spec"));
    return;
  }

  const message = {
    type: messageSpec.type,
    timestamp: new Date().toISOString(),
    ...data,
  };

  broadcastToChannel(channel, message);
}