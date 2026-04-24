export function buildOpenApiParameters(endpoint: any): any[] {
  const parameters: any[] = [];

  // Path parameters
  if (endpoint.params) {
    for (const [paramName] of Object.entries(endpoint.params)) {
      parameters.push({
        name: paramName,
        in: 'path',
        required: true,
        schema: { type: 'string' },
      });
    }
  }

  // Query parameters
  if (endpoint.query) {
    for (const [queryName] of Object.entries(endpoint.query)) {
      parameters.push({
        name: queryName,
        in: 'query',
        required: false,
        schema: { type: 'string' },
      });
    }
  }

  return parameters;
}
