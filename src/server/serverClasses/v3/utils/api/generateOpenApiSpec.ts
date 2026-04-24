import { buildOpenApiParameters } from "./buildOpenApiParameters";
import { buildOpenApiSchema } from "./buildOpenApiSchema";

export interface ApiSpec {
  http: Record<string, any>;
  ws: Record<string, any>;
}

export function generateOpenApiSpec(spec: ApiSpec): any {
  const paths: Record<string, any> = {};

  // Build OpenAPI paths from HTTP spec
  for (const [key, endpoint] of Object.entries(spec.http)) {
    const path = endpoint.path;
    const method = endpoint.method.toLowerCase();

    if (!paths[path]) {
      paths[path] = {};
    }

    paths[path][method] = {
      summary: endpoint.description,
      operationId: key,
      parameters: buildOpenApiParameters(endpoint),
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  ...buildOpenApiSchema(endpoint.response),
                },
              },
            },
          },
        },
      },
    };
  }

  return {
    openapi: '3.0.0',
    info: {
      title: 'Testeranto API',
      version: '1.0.0',
      description: 'API for Testeranto test management system',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    paths,
  };
}
