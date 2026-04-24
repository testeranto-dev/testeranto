export interface HonoRequestParams {
  method: string;
  path: string;
  url: URL;
}

export interface HonoRequestResult {
  routeName: string;
  method: string;
  isApiRoute: boolean;
  isRootPath: boolean;
}

export function handleHonoRequest(params: HonoRequestParams): HonoRequestResult {
  const isApiRoute = params.path.startsWith('/~/');
  const isRootPath = params.path === '/' || params.path === '';
  const routeName = isApiRoute ? params.path.slice(3) : params.path;

  return {
    routeName,
    method: params.method,
    isApiRoute,
    isRootPath,
  };
}
