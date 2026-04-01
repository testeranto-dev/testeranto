// WebSocket broadcast types
export interface ResourceChangedData {
  url: string;
  timestamp: string;
  message: string;
}

export interface ConnectedData {
  message: string;
  timestamp: string;
}

