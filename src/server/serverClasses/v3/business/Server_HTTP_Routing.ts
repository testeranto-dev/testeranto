import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_Docker } from "./Server_Docker";

/**
 * Server_HTTP_Routing - Business Layer (position 12)
 * 
 * Extends: Server_Docker (11)
 * Extended by: Server_WS (13)
 * Provides: HTTP request routing business logic
 * 
 * This class holds the pure business logic for HTTP request routing
 * that was previously in Server_HTTP (technological layer).
 * Technological HTTP server operations remain in Server_HTTP.
 */
export abstract class Server_HTTP_Routing extends Server_Docker {
  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    getCurrentTestResults: () => any,
    projectRoot?: string,
    resourceChangedCallback?: (path: string) => void
  ) {
    super(configs, mode, getCurrentTestResults, projectRoot, resourceChangedCallback);
  }

  // ========== HTTP Request Routing (Business Logic) ==========

  /**
   * Handle an incoming HTTP request.
   * Pure business logic for request routing.
   */
  protected abstract handleHonoRequest(request: Request): Promise<Response>;

  /**
   * Handle a specific route request.
   * Pure business logic for route handling.
   */
  protected abstract handleRouteRequest(request: Request, url: URL): Promise<Response>;

  /**
   * Handle a fallback request (when no route matches).
   * Pure business logic for fallback handling.
   */
  protected abstract handleFallbackRequest(request: Request, path: string): Promise<Response>;

  /**
   * Setup the Hono application with routes and middleware.
   * Business logic for app configuration.
   */
  protected abstract setupHonoApp(): void;
}
