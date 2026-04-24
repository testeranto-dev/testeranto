export function buildOpenApiSchema(response: any): Record<string, any> {
  if (!response || typeof response !== 'object') {
    return {};
  }

  // Simple schema extraction - could be enhanced
  const properties: Record<string, any> = {};
  for (const key in response) {
    if (response.hasOwnProperty(key)) {
      const value = response[key];
      properties[key] = {
        type: typeof value,
      };
    }
  }

  return properties;
}
