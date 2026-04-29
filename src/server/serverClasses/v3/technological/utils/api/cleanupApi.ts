export function cleanupApi(
  registeredRoutes: Map<string, (request: Request) => Promise<Response>>,
  registeredWsHandlers: Map<string, (message: any, client: any) => Promise<any>>,
  apiMiddleware: Array<(request: Request, next: () => Promise<Response>) => Promise<Response>>,
  logBusinessMessage: (message: string) => void,
): void {
  logBusinessMessage("Cleaning up API server...");
  registeredRoutes.clear();
  registeredWsHandlers.clear();
  apiMiddleware.length = 0;
  logBusinessMessage("API server cleaned up");
}