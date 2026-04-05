import { VscodeRouteHandler } from "../../vscode/VscodeRouteHandler";

export const handleRoutePure = (
  routeName: string,
  request: Request,
  url: URL,
  server: any,
): Response => {
  return VscodeRouteHandler.handleRoute(routeName, request, url, server);
};
