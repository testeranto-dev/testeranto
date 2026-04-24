import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_HTTP_Routing } from "./Server_HTTP_Routing";

/**
 * Server_WS - Business Layer (position 13)
 * 
 * Extends: Server_HTTP_Routing (12)
 * Extended by: Server_Api_Routing (14)
 * Provides: WebSocket message handling business logic
 * 
 * This class holds the pure business logic for WebSocket message handling
 * that was previously in Server_WS_HTTP (technological layer).
 * Technological WebSocket server operations remain in Server_WS_HTTP.
 */
export abstract class Server_WS extends Server_HTTP_Routing {
  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    getCurrentTestResults: () => any,
    projectRoot?: string,
    resourceChangedCallback?: (path: string) => void
  ) {
    super(configs, mode, getCurrentTestResults, projectRoot, resourceChangedCallback);
  }

  // ========== WebSocket Message Handling (Business Logic) ==========

  /**
   * Handle an incoming WebSocket message.
   * Pure business logic for message parsing and routing.
   */
  protected abstract handleWebSocketMessageV2Bun(ws: any, message: string | Buffer | object): void;

  /**
   * Handle a new WebSocket connection.
   * Business logic for connection initialization.
   */
  protected abstract handleWebSocketConnectionV2(ws: any): void;

  /**
   * Handle a WebSocket disconnection.
   * Business logic for cleanup.
   */
  protected abstract handleWebSocketDisconnectV2(clientId: string): void;

  /**
   * Clean up client subscriptions on disconnect.
   * Business logic for subscription management.
   */
  protected abstract cleanupClientSubscriptionsV2(clientId: string): void;

  // ========== V2 Message Handler Stubs (Business Logic) ==========

  protected abstract handleSubscribeToSliceV2(client: any, message: any): void;
  protected abstract handleUnsubscribeFromSliceV2(client: any, message: any): void;
  protected abstract handleSubscribeToChatV2(client: any, message: any): void;
  protected abstract handleUnsubscribeFromChatV2(client: any, message: any): void;
  protected abstract handleSendChatMessageV2(client: any, message: any): void;
  protected abstract handleGetChatHistoryV2(client: any, message: any): void;
}
