import { wsApi } from "../../../../../api";

export function matchWsMessageToApi(type: string): string | null {
  for (const [key, message] of Object.entries(wsApi)) {
    // Skip slices as it's not a message type
    if (key === 'slices') continue;

    if (message.type === type) {
      return key;
    }
  }
  return null;
}
