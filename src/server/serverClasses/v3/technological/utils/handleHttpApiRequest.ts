export async function handleHttpApiRequest(
  request: Request,
  endpointKey: string,
  middlewares: Array<(request: Request, next: () => Promise<Response>) => Promise<Response>>,
  registeredRoutes: Map<string, (request: Request) => Promise<Response>>,
  handleDefaultApiRequest: (request: Request, endpointKey: string) => Promise<Response>,
  logBusinessError: (message: string, error: any) => void,
): Promise<Response> {
  try {
    let index = 0;
    const next = async (): Promise<Response> => {
      if (index < middlewares.length) {
        const middleware = middlewares[index];
        index++;
        return await middleware(request, next);
      } else {
        const routeName = endpointKey.replace("/~/", "");
        const handler = registeredRoutes.get(routeName);
        if (handler) {
          return await handler(request);
        } else {
          return await handleDefaultApiRequest(request, endpointKey);
        }
      }
    };
    return await next();
  } catch (error: any) {
    logBusinessError(`Error handling HTTP API request for ${endpointKey}:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}