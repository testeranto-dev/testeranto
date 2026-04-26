import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_WS } from "./Server_WS";

/**
 * Server_Api_Routing - Business Layer (position 14)
 * 
 * Extends: Server_WS (13)
 * Extended by: Server (15)
 * Provides: API routing business logic
 * 
 * This class holds the pure business logic for API request routing
 * that was previously in Server_Api (technological layer).
 * Technological API server operations remain in Server_Api.
 */
export abstract class Server_Api_Routing extends Server_WS {
  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    getCurrentTestResults: () => any,
    projectRoot?: string,
    resourceChangedCallback?: (path: string) => void
  ) {
    super(configs, mode, getCurrentTestResults, projectRoot, resourceChangedCallback);
  }

  // ========== API Request Handling (Business Logic) ==========

  /**
   * Handle a spawn agent request.
   * Business logic for agent spawning.
   */
  protected abstract handleSpawnAgent(request: Request): Promise<Response>;


  /**
   * Handle a WebSocket chat message.
   * Business logic for chat message processing.
   */
  protected abstract handleWebSocketChatMessage(client: any, message: any): Promise<void>;

  /**
   * Register default HTTP routes from the API specification.
   * Business logic for route registration.
   */
  protected abstract registerDefaultHttpRoutes(): Promise<void>;

  /**
   * Handle a default API request (when no specific handler is registered).
   * Business logic for request routing.
   */
  protected abstract handleDefaultApiRequest(request: Request, endpointKey: string): Promise<Response>;

  /**
   * Handle an HTTP API request with middleware support.
   * Business logic for request handling.
   */
  protected abstract handleHttpApiRequest(request: Request, endpointKey: string): Promise<Response>;

  /**
   * Match a WebSocket message type to its API key.
   * Business logic for message matching.
   */
  protected abstract matchWsMessageToApi(type: string): string | null;
}
