import { wsApi } from "../../../../../../api";

export function broadcastApiMessage(
  messageType: string,
  data: any,
  broadcast: (message: any, filter?: (client: any) => boolean) => void,
  logBusinessError: (message: string, error: any) => void,
): void {
  const messageSpec = wsApi[messageType as keyof typeof wsApi];
  if (!messageSpec) {
    logBusinessError(`Cannot broadcast: message type '${messageType}' not found in wsApi`, new Error("Missing spec"));
    return;
  }

  const message = {
    type: messageSpec.type,
    timestamp: new Date().toISOString(),
    ...data,
  };

  broadcast(message);
}