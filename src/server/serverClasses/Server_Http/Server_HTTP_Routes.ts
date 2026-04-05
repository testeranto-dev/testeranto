import { handleRoutePure } from "./handleRoutePure";

export class Server_HTTP_Routes {
  constructor(private server: any) { }

  async handleRoute(
    routeName: string,
    request: Request,
    url: URL,
  ): Promise<Response> {
    try {
      // Only handle vscode API routes (which start with /~/)
      // Stakeholder app uses static files only, no HTTP API routes
      return handleRoutePure(routeName, request, url, this.server);
    } catch (error: any) {
      console.error('[Server_HTTP_Routes] Error handling route:', error);
      return new Response(JSON.stringify({
        error: "Internal server error",
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
}
