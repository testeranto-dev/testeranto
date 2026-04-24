import type { ITesterantoConfig } from "../../../../../Types";

export interface RouteRegistration {
  method: string;
  path: string;
  endpointKey: string;
}

export function registerDefaultHttpRoutes(configs: ITesterantoConfig): RouteRegistration[] {
  const routes: RouteRegistration[] = [];

  // Health check route
  routes.push({
    method: 'GET',
    path: '/~/health',
    endpointKey: 'health',
  });

  // View routes from config
  if (configs.views) {
    for (const viewKey of Object.keys(configs.views)) {
      routes.push({
        method: 'GET',
        path: `/~/views/${viewKey}`,
        endpointKey: `view:${viewKey}`,
      });
    }
  }

  return routes;
}
