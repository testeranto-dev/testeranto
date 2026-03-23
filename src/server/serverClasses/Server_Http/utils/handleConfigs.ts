import { Server_HTTP_utils } from "./Server_HTTP_utils";

export const handleConfigs = (server: any): Response => {
  if (!server.configs) {
    return Server_HTTP_utils.jsonResponse(
      {
        error: "Server configs not available",
      },
      503,
    );
  }
  return Server_HTTP_utils.jsonResponse({
    configs: server.configs,
    message: "Success",
  });
};
