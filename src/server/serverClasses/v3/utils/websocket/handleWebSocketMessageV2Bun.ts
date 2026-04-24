export interface WebSocketMessageV2BunParams {
  message: string | Buffer | object;
  clientId: string;
}

export interface ParsedWebSocketMessage {
  type: string;
  [key: string]: any;
}

export function handleWebSocketMessageV2Bun(params: WebSocketMessageV2BunParams): ParsedWebSocketMessage | null {
  try {
    let parsed: any;
    if (typeof params.message === 'string') {
      parsed = JSON.parse(params.message);
    } else if (params.message instanceof Buffer) {
      parsed = JSON.parse(new TextDecoder().decode(params.message));
    } else if (typeof params.message === 'object' && params.message !== null) {
      parsed = params.message;
    } else {
      return null;
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.type) {
      return null;
    }

    return parsed as ParsedWebSocketMessage;
  } catch {
    return null;
  }
}
