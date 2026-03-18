import { handleRoutePure } from "./Server_HTTP_Routes_Utils_Pure";

export const handleRoute = (
  routeName: string,
  request: Request,
  url: URL,
  server: any
): Response | Promise<Response> => {
  return handleRoutePure(routeName, request, url, server);
};
