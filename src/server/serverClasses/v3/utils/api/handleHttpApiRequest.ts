export interface HttpApiRequestParams {
  endpointKey: string;
  method: string;
  path: string;
  body?: any;
}

export interface HttpApiRequestResult {
  status: number;
  body: any;
}

export function handleHttpApiRequest(params: HttpApiRequestParams): HttpApiRequestResult {
  return {
    status: 200,
    body: {
      endpointKey: params.endpointKey,
      method: params.method,
      path: params.path,
      timestamp: new Date().toISOString(),
    },
  };
}
