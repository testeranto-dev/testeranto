import { vscodeHttpAPI } from "../../../api";
import { handleRoutePure } from "./handleRoutePure";

// Helper to extract route name from API path
const extractRouteNameFromPath = (path: string): string => {
  // Remove leading /~/ prefix
  if (path.startsWith('/~/')) {
    return path.substring(3);
  }
  return path;
};

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
    } catch (error) {
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
