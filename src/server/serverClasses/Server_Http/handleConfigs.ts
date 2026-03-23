import { jsonResponse } from "./jsonResponse";

export const handleConfigs = (server: any): Response => {
  if (!server.configs) {
    return jsonResponse(
      {
        error: "Server configs not available",
      },
      503,
    );
  }
  return jsonResponse({
    configs: server.configs,
    message: "Success",
  });
};
