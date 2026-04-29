export function createStandardRequest(internalRequest: any): Request {
  if (internalRequest instanceof Request) {
    return internalRequest;
  }

  const url = internalRequest.url || "http://localhost";
  const method = internalRequest.method || "GET";
  const headers = new Headers(internalRequest.headers || {});
  const body = internalRequest.body || null;

  return new Request(url, {
    method,
    headers,
    body,
  });
}