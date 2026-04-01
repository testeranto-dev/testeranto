import { jsonResponse } from "./jsonResponse";
import { vscodeHttpAPI, VscodeHttpResponse } from "../../../api";

export const handleConfigs = (server: any, request?: Request): Response => {
  // Validate against API definition
  const apiDef = vscodeHttpAPI.getConfigs;

  if (request && request.method !== apiDef.method) {
    return jsonResponse(
      {
        error: `Method ${request.method} not allowed for configs. Expected ${apiDef.method}`,
      },
      405,
    );
  }

  if (!server.configs) {
    return jsonResponse(
      {
        error: "Server configs not available",
      },
      503,
    );
  }

  // Return response matching API schema with proper typing
  const response: VscodeHttpResponse<'getConfigs'> = {
    configs: server.configs,
    message: "Success",
  };

  return jsonResponse(response, 200, vscodeHttpAPI.getConfigs);
};
