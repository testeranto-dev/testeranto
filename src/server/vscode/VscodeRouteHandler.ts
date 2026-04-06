import { getApiDefinitionForRoute } from "../serverClasses/Server_Http/getApiDefinitionForRoute";
import { handleOptions } from "../serverClasses/Server_Http/handleOptions";
import { jsonResponse } from "../serverClasses/Server_Http/jsonResponse";
import { createRouteHandlersMap } from './createRouteHandlersMap';

export class VscodeRouteHandler {
  static handleRoute(
    routeName: string,
    request: Request,
    url: URL,
    server: any,
  ): Response {
    // Log for debugging directory traversal errors
    console.log(`[VscodeRouteHandler] Handling route: ${routeName}, method: ${request.method}, url: ${url}`);

    // API call logging
    console.log(`[API] ${request.method} ${routeName}`);

    // Handle OPTIONS requests
    if (request.method === "OPTIONS") {
      return handleOptions(request, routeName);
    }

    // Get API definition for this route, considering the request method
    const apiDefinition = getApiDefinitionForRoute(routeName, request.method);

    // Validate HTTP method against API definition
    if (apiDefinition && request.method !== apiDefinition.method) {
      return jsonResponse(
        {
          error: `Method ${request.method} not allowed for route ${routeName}. Expected ${apiDefinition.method}`,
        },
        405,
      );
    }

    // Only handle GET requests for now (unless API definition specifies otherwise)
    if (!apiDefinition && request.method !== "GET") {
      return jsonResponse(
        {
          error: `Method ${request.method} not allowed`,
        },
        405,
      );
    }

    // Check for process-logs route (parameterized route) - deprecated
    if (routeName.startsWith("process-logs/")) {
      return jsonResponse(
        {
          error: `Endpoint ${routeName} is deprecated`,
          message: 'This endpoint has been removed in the unified graph-based approach. All data should be loaded from graph-data.json and updated via WebSocket.',
          instructions: 'Clients should load baseline data from graph-data.json and subscribe to WebSocket updates'
        },
        410, // Gone - resource is no longer available
      );
    }

    // Get route handlers from API definitions
    const routeHandlers = createRouteHandlersMap();
    const handler = routeHandlers[routeName];

    if (handler) {
      return handler(server, url, request);
    }

    return jsonResponse(
      {
        error: `Route not found: ${routeName}`,
      },
      404,
    );
  }
}
