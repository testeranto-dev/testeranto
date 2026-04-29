import { API, matchApiRoute } from "../../../../../../api";

export function validateHttpApiRequest(
  request: Request,
): {
  isValid: boolean;
  endpointKey?: string;
  errors?: string[];
} {
  const url = new URL(request.url);
  const routeName = url.pathname.replace("/~/", "");
  const method = request.method;

  const endpointKey = matchApiRoute(routeName, method);
  if (endpointKey) {
    return { isValid: true, endpointKey };
  }

  for (const [key, endpoint] of Object.entries(API)) {
    const endpointPath = endpoint.path.replace("/~/", "");
    if (endpointPath === routeName && endpoint.method === method) {
      return { isValid: true, endpointKey: key };
    }
  }

  return {
    isValid: false,
    errors: [`No API endpoint found for ${method} ${routeName}`],
  };
}