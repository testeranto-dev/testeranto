import type { VscodeHttpResponse } from "../../../api";
import { vscodeHttpAPI } from "../../../api/vscodeExtensionHttp";
import { jsonResponse } from "./jsonResponse";

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

  console.log('[handleConfigs] Server object keys:', Object.keys(server));
  console.log('[handleConfigs] Server has configs property:', 'configs' in server);
  console.log('[handleConfigs] server.configs value:', server.configs);

  // Check if server has configs property
  const configs = server.configs;

  if (!configs) {
    console.warn('[handleConfigs] server.configs is undefined or null');
    // Return empty configs structure instead of error
    const emptyResponse: VscodeHttpResponse<'getConfigs'> = {
      configs: {
        runtimes: {},
        volumes: [],
        featureIngestor: "",
        documentationGlob: "",
        stakeholderReactModule: ""
      },
      message: "Server configs not loaded yet",
    };
    return jsonResponse(emptyResponse, 200, vscodeHttpAPI.getConfigs);
  }

  // Ensure configs has the expected structure
  // If configs is empty or doesn't have runtimes, return a valid structure
  if (!configs.runtimes || Object.keys(configs.runtimes).length === 0) {
    console.warn('[handleConfigs] server.configs.runtimes is empty or missing');
    const emptyConfigs = {
      runtimes: {},
      volumes: configs.volumes || [],
      featureIngestor: configs.featureIngestor || "",
      documentationGlob: configs.documentationGlob || "",
      stakeholderReactModule: configs.stakeholderReactModule || ""
    };

    const response: VscodeHttpResponse<'getConfigs'> = {
      configs: emptyConfigs,
      message: "No runtimes configured",
    };
    return jsonResponse(response, 200, vscodeHttpAPI.getConfigs);
  }

  console.log('[handleConfigs] Returning configs with runtimes:', Object.keys(configs.runtimes));

  // Return response matching API schema with proper typing
  const response: VscodeHttpResponse<'getConfigs'> = {
    configs: configs,
    message: "Success",
  };

  return jsonResponse(response, 200, vscodeHttpAPI.getConfigs);
};
