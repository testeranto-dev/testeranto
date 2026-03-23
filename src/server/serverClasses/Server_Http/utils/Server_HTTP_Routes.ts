import { handleRoutePure } from "./handleRoutePure";

export class Server_HTTP_Routes {
  constructor(private server: any) { }

  handleRoute(
    routeName: string,
    request: Request,
    url: URL,
  ): Response | Promise<Response> {
    return handleRoutePure(routeName, request, url, this.server);
  }
}
