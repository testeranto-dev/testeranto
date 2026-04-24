import type { ITesterantoConfig } from "../../../../../Types";

export interface DefaultApiRequestResult {
  endpointKey: string;
  method: string;
  path: string;
  status: number;
  body: any;
}

export function handleDefaultApiRequest(
  endpointKey: string,
  method: string,
  path: string,
  configs: ITesterantoConfig,
): DefaultApiRequestResult {
  switch (endpointKey) {
    case 'getConfigs':
      return {
        endpointKey,
        method,
        path,
        status: 200,
        body: {
          configs,
          timestamp: new Date().toISOString(),
        },
      };

    case 'getAppState':
      return {
        endpointKey,
        method,
        path,
        status: 200,
        body: {
          isRunning: false,
          startedAt: null,
          mode: 'dev',
          timestamp: new Date().toISOString(),
        },
      };

    default:
      return {
        endpointKey,
        method,
        path,
        status: 501,
        body: {
          endpoint: endpointKey,
          method,
          path,
          message: `Endpoint '${endpointKey}' is registered but handler not implemented`,
          timestamp: new Date().toISOString(),
        },
      };
  }
}
