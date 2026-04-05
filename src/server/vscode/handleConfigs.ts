import type { VscodeHttpResponse } from "../../api";
import { vscodeHttpAPI } from "../../api/vscodeExtensionHttp";
import { jsonResponse } from "../serverClasses/Server_Http/jsonResponse";

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

  // Check if server has configs property
  const configs = server.configs;

  if (!configs) {
    throw ('[handleConfigs] server.configs is undefined or null');
  }

  // Ensure configs has the expected structure
  // If configs is empty or doesn't have runtimes, return a valid structure
  if (!configs.runtimes || Object.keys(configs.runtimes).length === 0) {
    throw ('[handleConfigs] server.configs.runtimes is empty or missing');
  }

  // Return response matching API schema with proper typing
  const response: VscodeHttpResponse<'getConfigs'> = {
    configs: configs,
    message: "Success",
  };

  return jsonResponse(response, 200, vscodeHttpAPI.getConfigs);
};
