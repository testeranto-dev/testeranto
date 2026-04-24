import { API } from "../../../api";

export const handleOptions = (request?: Request, routeName?: string): Response => {
  // Default allowed methods
  let allowedMethods = ["GET", "OPTIONS"];

  // If we have a route name, check API definitions for allowed methods
  if (routeName && request) {
    // Check vscodeHttpAPI
    for (const [key, definition] of Object.entries(API)) {
      const apiDef = definition as any;
      const apiRouteName = apiDef.path.startsWith("/~/") ? apiDef.path.substring(3) : apiDef.path;
      if (apiRouteName === routeName) {
        allowedMethods = [apiDef.method, "OPTIONS"];
        break;
      }
    }

    // Note: stakeholderHttpAPI is deprecated in unified graph-based approach
    // All API endpoints should be defined in vscodeHttpAPI
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": allowedMethods.join(", "),
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
