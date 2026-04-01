import type { stakeholderHttpAPI } from "./api/stakeholderHttp";
import { vscodeHttpAPI } from "./api/vscodeExtensionHttp";
import type { vscodeWsAPI } from "./api/vscodeExtensionWs";

// Base API definition types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

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

// Response type helpers
export type ApiResponse<T> = {
  success?: boolean;
  error?: string;
  message: string;
  timestamp: string;
} & T;



// Type for vscodeHttpAPI
export type VscodeHttpAPI = typeof vscodeHttpAPI;
export type VscodeHttpEndpoint = keyof VscodeHttpAPI;
export type VscodeHttpEndpointDefinition<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T];

// Helper to get response type for an endpoint
export type VscodeHttpResponse<T extends VscodeHttpEndpoint> =
  VscodeHttpAPI[T]['response'];

// Helper to get query params type for an endpoint
export type VscodeHttpQuery<T extends VscodeHttpEndpoint> =
  VscodeHttpAPI[T] extends { query: infer Q } ? Q : never;

// Helper to get path params type for an endpoint
export type VscodeHttpParams<T extends VscodeHttpEndpoint> =
  VscodeHttpAPI[T] extends { params: infer P } ? P : never;



// Type for stakeholderHttpAPI
export type StakeholderHttpAPI = typeof stakeholderHttpAPI;
export type StakeholderHttpEndpoint = keyof StakeholderHttpAPI;
export type StakeholderHttpEndpointDefinition<T extends StakeholderHttpEndpoint> = StakeholderHttpAPI[T];

// Helper to get response type for an endpoint
export type StakeholderHttpResponse<T extends StakeholderHttpEndpoint> =
  StakeholderHttpAPI[T]['response'];



// Type for vscodeWsAPI
export type VscodeWsAPI = typeof vscodeWsAPI;
export type VscodeWsMessage = keyof VscodeWsAPI;
export type VscodeWsMessageDefinition<T extends VscodeWsMessage> = VscodeWsAPI[T];

// Helper to get response type for a message
export type VscodeWsResponse<T extends VscodeWsMessage> =
  VscodeWsAPI[T]['response'];

// Helper to get data type for a message
export type VscodeWsData<T extends VscodeWsMessage> =
  VscodeWsAPI[T] extends { data: infer D } ? D : never;

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
