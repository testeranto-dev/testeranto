import { API } from "../../../../../api";
import type { ITesterantoConfig } from "../../../../../Types";

export function registerDefaultHttpRoutes(
  configs: ITesterantoConfig,
  addRoute: (method: string, path: string, handler: (request: any) => Promise<any>) => void,
  handleHttpApiRequest: (request: any, endpointKey: string) => Promise<Response>,
  handleViewRoute: (request: any, viewName: string) => Promise<Response>,
  logBusinessMessage: (message: string) => void,
): void {
  addRoute("GET", "/~/health", async (request: any) => {
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        message: "Testeranto API server is running",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  });
  logBusinessMessage("Registered health check route: GET /~/health");

  for (const [endpointKey, endpoint] of Object.entries(API)) {
    const method = endpoint.method;
    const path = endpoint.path;

    addRoute(method, path, async (request: any) => {
      return await handleHttpApiRequest(request, endpointKey);
    });

    logBusinessMessage(`Registered API route: ${method} ${path} (${endpointKey})`);
  }

  if (configs.views) {
    for (const viewKey of Object.keys(configs.views)) {
      addRoute("GET", `/~/views/${viewKey}`, async (request: any) => {
        return await handleViewRoute(request, viewKey);
      });
      logBusinessMessage(`Registered view route: GET /~/views/${viewKey}`);
    }
  }

  logBusinessMessage(
    `Registered ${Object.keys(API).length} API routes and ${configs.views ? Object.keys(configs.views).length : 0} view routes`,
  );
}