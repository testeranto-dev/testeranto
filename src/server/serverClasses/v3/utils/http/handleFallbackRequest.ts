export interface FallbackRequestParams {
  path: string;
  method: string;
}

export interface FallbackRequestResult {
  path: string;
  method: string;
  status: number;
  body: any;
}

export function handleFallbackRequest(params: FallbackRequestParams): FallbackRequestResult {
  return {
    path: params.path,
    method: params.method,
    status: 404,
    body: {
      error: 'Not found',
      message: `Path ${params.path} not found`,
      timestamp: new Date().toISOString(),
    },
  };
}
