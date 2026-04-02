// Base API definition types
export type HttpMethod = 'GET' | 'POST' | 'PUT' |
  'DELETE' | 'PATCH' | 'OPTIONS';

export interface ApiEndpointDefinition<TParams = any, TQuery = any, TResponse = any> {
  method: HttpMethod;
  path: string;
  description: string;
  params?: TParams;
  query?: TQuery;
  response: TResponse;
}

export interface WebSocketMessageDefinition<TData = any, TResponse = any> {
  type: string;
  description: string;
  data?: TData;
  response: TResponse;
}

export interface WebSocketBroadcastDefinition<TData = any> {
  type: string;
  description: string;
  data?: TData;
}

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

// Response type helpers
export type ApiResponse<T> = {
  success?: boolean;
  error?: string;
  message: string;
  timestamp: string;
} & T;

// Re-export API implementations
export { vscodeHttpAPI } from "./api/vscodeExtensionHttp";
export { stakeholderHttpAPI } from "./api/stakeholderHttp";
export { vscodeWsAPI } from "./api/vscodeExtensionWs";


// Type aliases
export type VscodeHttpAPI = _VscodeHttpAPI;
export type VscodeHttpEndpoint = keyof VscodeHttpAPI;
export type VscodeHttpEndpointDefinition<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T];
export type VscodeHttpResponse<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T]['response'];
export type VscodeHttpQuery<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T] extends { query: infer Q } ? Q : never;
export type VscodeHttpParams<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T] extends { params: infer P } ? P : never;

export type StakeholderHttpAPI = _StakeholderHttpAPI;
export type StakeholderHttpEndpoint = keyof StakeholderHttpAPI;
export type StakeholderHttpEndpointDefinition<T extends StakeholderHttpEndpoint> = StakeholderHttpAPI[T];
export type StakeholderHttpResponse<T extends StakeholderHttpEndpoint> = StakeholderHttpAPI[T]['response'];

export type VscodeWsAPI = _VscodeWsAPI;
export type VscodeWsMessage = keyof VscodeWsAPI;
export type VscodeWsMessageDefinition<T extends VscodeWsMessage> = VscodeWsAPI[T];
export type VscodeWsResponse<T extends VscodeWsMessage> = VscodeWsAPI[T]['response'];
export type VscodeWsData<T extends VscodeWsMessage> = VscodeWsAPI[T] extends { data: infer D } ? D : never;

// stakeholderWsAPI with proper typing
export const stakeholderWsAPI = {
  // WebSocket broadcasts from server to clients
  resourceChanged: {
    type: 'resourceChanged' as const,
    description: 'Notify that a resource has changed',
    data: {} as ResourceChangedData
  },

  connected: {
    type: 'connected' as const,
    description: 'Connection established',
    data: {} as ConnectedData
  }
} as const;

// Type for stakeholderWsAPI
export type StakeholderWsAPI = typeof stakeholderWsAPI;
export type StakeholderWsMessage = keyof StakeholderWsAPI;
export type StakeholderWsMessageDefinition<T extends StakeholderWsMessage> = StakeholderWsAPI[T];

// Helper to get data type for a broadcast
export type StakeholderWsData<T extends StakeholderWsMessage> =
  StakeholderWsAPI[T]['data'];
