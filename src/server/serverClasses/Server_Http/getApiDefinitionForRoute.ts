
import { vscodeHttpAPI } from "../../../api/vscodeExtensionHttp";
import { extractRouteNameFromPath } from "./extractRouteNameFromPath";

// Helper function to get API definition for a route, optionally filtering by method
export const getApiDefinitionForRoute = (routeName: string, method?: string): any => {
  // Check if routeName matches any API definition path
  for (const [key, definition] of Object.entries(vscodeHttpAPI)) {
    const apiDef = definition as any;
    const apiRouteName = extractRouteNameFromPath(apiDef.path);
    if (apiRouteName === routeName) {
      // If method is provided, check if it matches
      if (method && apiDef.method !== method) {
        continue;
      }
      return apiDef;
    }
  }
  return null;
};
