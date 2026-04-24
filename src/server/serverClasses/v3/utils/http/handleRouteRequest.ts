export interface RouteRequestParams {
  routeName: string;
  method: string;
  url: URL;
}

export interface RouteRequestResult {
  routeName: string;
  method: string;
  found: boolean;
}

export function handleRouteRequest(params: RouteRequestParams): RouteRequestResult {
  return {
    routeName: params.routeName,
    method: params.method,
    found: false,
  };
}
