import { registerDefaultHttpRoutes } from "../registerDefaultHttpRoutes";

export async function setupApi(
  on: (event: string, handler: (data: any) => void) => void,
  matchWsMessageToApi: (type: string) => string | null,
  handleWebSocketApiMessage: (client: any, message: any) => Promise<void>,
  addRoute: (method: string, path: string, handler: (request: any) => Promise<any>) => void,
  handleHttpApiRequest: (request: any, endpointKey: string) => Promise<Response>,
  handleViewRoute: (request: any, viewName: string) => Promise<Response>,
  configs: any,
  logBusinessMessage: (message: string) => void,
): Promise<void> {
  logBusinessMessage("Setting up API server...");

  on("websocketMessage", ({ client, message }: { client: any; message: any }) => {
    if (message.type && matchWsMessageToApi(message.type)) {
      handleWebSocketApiMessage(client, message);
    }
  });

  registerDefaultHttpRoutes(
    configs,
    addRoute,
    handleHttpApiRequest,
    handleViewRoute,
    logBusinessMessage,
  );

  logBusinessMessage("API server setup complete");
}