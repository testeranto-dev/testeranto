import { vscodeHttpAPI } from "../../api";
import { getApiDefinitionForRoute } from "../serverClasses/Server_Http/getApiDefinitionForRoute";
import { handleOptions } from "../serverClasses/Server_Http/handleOptions";
import { jsonResponse } from "../serverClasses/Server_Http/jsonResponse";
import { createRouteHandlersMap } from './createRouteHandlersMap';
import { handleProcessLogs } from './handleProcessLogs';

export class VscodeRouteHandler {
  static handleRoute(
    routeName: string,
    request: Request,
    url: URL,
    server: any,
  ): Response {
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

    // Check for process-logs route (parameterized route)
    if (routeName.startsWith("process-logs/")) {
      const processId = routeName.substring("process-logs/".length);
      // Validate against API definition
      const apiDef = vscodeHttpAPI.getProcessLogs;
      if (request.method !== apiDef.method) {
        return jsonResponse(
          {
            error: `Method ${request.method} not allowed for process-logs. Expected ${apiDef.method}`,
          },
          405,
        );
      }
      return handleProcessLogs(server, processId);
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
