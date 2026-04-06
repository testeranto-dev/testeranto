// VS Code extension HTTP API definitions
import type { ApiEndpointDefinition } from './api';

// WE have 2 ROUTES. TWO!!!!
export const vscodeHttpAPI = {
  // Get the current graph state
  getGraph: {
    method: 'GET' as const,
    path: '/~/graph',
    description: 'Get current graph state',
    response: {} as any
  },
  // Update graph with operations
  updateGraph: {
    method: 'POST' as const,
    path: '/~/graph',
    description: 'Update graph with operations',
    response: {} as any
  }
} as const;

export type VscodeHttpAPI = typeof vscodeHttpAPI;
export type VscodeHttpEndpoint = keyof VscodeHttpAPI;
export type VscodeHttpEndpointDefinition<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T];
export type VscodeHttpResponse<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T]['response'];
export type VscodeHttpQuery<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T] extends { query: infer Q } ? Q : never;
export type VscodeHttpParams<T extends VscodeHttpEndpoint> = VscodeHttpAPI[T] extends { params: infer P } ? P : never;
