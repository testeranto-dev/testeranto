import { API, wsApi } from "../../../../api";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_Lock } from "./Server_Lock";
import { Server_Static } from "./Server_Static";

/**
 * Server_ApiSpec - Business Layer (-1.5)
 * 
 * Extends: Server_Static (-1)
 * Extended by: [To be determined]
 * Provides: API specification business logic for both HTTP and WebSocket
 */
export abstract class Server_ApiSpec extends Server_Lock {
  protected apiSpec: {
    http: Record<string, any>;
    ws: Record<string, any>;
  };
  protected routes: any[] = [];

  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    getCurrentTestResults: () => any,
    projectRoot?: string,
    resourceChangedCallback?: (path: string) => void
  ) {
    super(configs, mode, getCurrentTestResults, projectRoot, resourceChangedCallback);
    this.apiSpec = this.initializeApiSpec();
  }

  // ========== API Specification Initialization ==========

  private initializeApiSpec(): { http: Record<string, any>; ws: Record<string, any> } {
    // Build HTTP API spec from API.ts
    const httpSpec: Record<string, any> = {};
    for (const [key, endpoint] of Object.entries(API)) {
      httpSpec[key] = {
        method: endpoint.method,
        path: endpoint.path,
        description: endpoint.description,
        params: endpoint.params || {},
        query: endpoint.query || {},
        response: endpoint.response
      };
    }

    // Build WebSocket API spec from wsApi
    const wsSpec: Record<string, any> = {};
    for (const [key, message] of Object.entries(wsApi)) {
      // Handle special cases
      if (key === 'slices') {
        // 'slices' is a collection of slice paths, not a message type
        // Store it as-is without adding extra properties
        wsSpec[key] = message;
      } else {
        // Regular WebSocket message
        wsSpec[key] = {
          type: message.type,
          description: message.description,
          data: message.data || {}
        };
      }
    }

    return { http: httpSpec, ws: wsSpec };
  }

  // ========== API Specification Access ==========

  getHttpApiSpec(): Record<string, any> {
    return { ...this.apiSpec.http };
  }

  getWsApiSpec(): Record<string, any> {
    return { ...this.apiSpec.ws };
  }

  getCompleteApiSpec(): { http: Record<string, any>; ws: Record<string, any> } {
    return {
      http: this.getHttpApiSpec(),
      ws: this.getWsApiSpec()
    };
  }

  getHttpEndpoint(key: string): any {
    const endpoint = this.apiSpec.http[key];
    if (!endpoint) {
      throw new Error(`HTTP endpoint '${key}' not found in API specification`);
    }
    return { ...endpoint };
  }

  getWsMessageType(key: string): any {
    const message = this.apiSpec.ws[key];
    if (!message) {
      throw new Error(`WebSocket message type '${key}' not found in API specification`);
    }
    // For slices, return as-is (it's not a message type)
    return { ...message };
  }

  // ========== API Validation ==========

  validateHttpRequest(routeName: string, method: string, params?: Record<string, any>, query?: Record<string, any>): {
    isValid: boolean;
    endpointKey?: string;
    errors?: string[];
  } {
    const errors: string[] = [];

    // Find matching endpoint
    let endpointKey: string | null = null;
    for (const [key, endpoint] of Object.entries(this.apiSpec.http)) {
      // Check if this endpoint matches the route
      const endpointPath = endpoint.path.replace('/~/', '');
      if (endpointPath === routeName && endpoint.method === method) {
        endpointKey = key;
        break;
      }
    }

    if (!endpointKey) {
      errors.push(`No API endpoint found for route '${routeName}' with method '${method}'`);
      return { isValid: false, errors };
    }

    const endpoint = this.apiSpec.http[endpointKey];

    // Validate required params
    if (endpoint.params) {
      for (const [paramName, paramValue] of Object.entries(endpoint.params)) {
        if (paramValue === '' && (!params || !params[paramName])) {
          errors.push(`Missing required parameter: ${paramName}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      endpointKey,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  validateWsMessage(message: any): {
    isValid: boolean;
    messageType?: string;
    errors?: string[];
  } {
    const errors: string[] = [];

    if (!message || typeof message !== 'object') {
      errors.push('Message must be an object');
      return { isValid: false, errors };
    }

    if (!message.type) {
      errors.push('Message must have a type field');
      return { isValid: false, errors };
    }

    // Find matching message type
    let messageType: string | null = null;
    for (const [key, spec] of Object.entries(this.apiSpec.ws)) {
      // Skip slices as it's not a message type
      if (key === 'slices') continue;
      
      if (spec.type === message.type) {
        messageType = key;
        break;
      }
    }

    if (!messageType) {
      errors.push(`Unknown WebSocket message type: ${message.type}`);
      return { isValid: false, errors };
    }

    return {
      isValid: errors.length === 0,
      messageType,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // ========== API Response Formatting ==========

  formatHttpResponse(endpointKey: string, data: any, options?: {
    success?: boolean;
    error?: string;
    message?: string;
  }): any {
    const endpoint = this.apiSpec.http[endpointKey];
    if (!endpoint) {
      throw new Error(`Cannot format response for unknown endpoint: ${endpointKey}`);
    }

    const timestamp = new Date().toISOString();
    const baseResponse = {
      success: options?.success ?? true,
      error: options?.error,
      message: options?.message ?? 'OK',
      timestamp,
      ...data
    };

    return baseResponse;
  }

  formatWsResponse(messageType: string, data: any): any {
    const messageSpec = this.apiSpec.ws[messageType];
    if (!messageSpec) {
      throw new Error(`Cannot format response for unknown message type: ${messageType}`);
    }

    return {
      type: messageSpec.type,
      timestamp: new Date().toISOString(),
      ...data
    };
  }

  formatErrorResponse(error: Error, context?: string): any {
    return {
      success: false,
      error: error.message,
      message: context || 'An error occurred',
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }

  // ========== API Documentation Generation ==========

  generateOpenApiSpec(): any {
    const paths: Record<string, any> = {};

    // Build OpenAPI paths from HTTP spec
    for (const [key, endpoint] of Object.entries(this.apiSpec.http)) {
      const path = endpoint.path;
      const method = endpoint.method.toLowerCase();

      if (!paths[path]) {
        paths[path] = {};
      }

      paths[path][method] = {
        summary: endpoint.description,
        operationId: key,
        parameters: this.buildOpenApiParameters(endpoint),
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
                    ...this.buildOpenApiSchema(endpoint.response)
                  }
                }
              }
            }
          }
        }
      };
    }

    return {
      openapi: '3.0.0',
      info: {
        title: 'Testeranto API',
        version: '1.0.0',
        description: 'API for Testeranto test management system'
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      paths
    };
  }

  private buildOpenApiParameters(endpoint: any): any[] {
    const parameters: any[] = [];

    // Path parameters
    if (endpoint.params) {
      for (const [paramName] of Object.entries(endpoint.params)) {
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' }
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
          schema: { type: 'string' }
        });
      }
    }

    return parameters;
  }

  private buildOpenApiSchema(response: any): any {
    if (!response || typeof response !== 'object') {
      return {};
    }

    // Simple schema extraction - could be enhanced
    const properties: Record<string, any> = {};
    for (const key in response) {
      if (response.hasOwnProperty(key)) {
        const value = response[key];
        properties[key] = {
          type: typeof value
        };
      }
    }

    return properties;
  }

  // ========== Setup and Cleanup ==========

  async setupApiSpec(): Promise<void> {
    this.logBusinessMessage("Setting up API specification...");
    // Validate API spec on startup
    this.validateApiSpec();
    this.logBusinessMessage("API specification setup complete");
  }

  async cleanupApiSpec(): Promise<void> {
    this.logBusinessMessage("Cleaning up API specification...");
    // Nothing to clean up for spec
    this.logBusinessMessage("API specification cleaned up");
  }

  private validateApiSpec(): void {
    const errors: string[] = [];

    // Validate HTTP endpoints
    for (const [key, endpoint] of Object.entries(this.apiSpec.http)) {
      if (!endpoint.method || !endpoint.path) {
        errors.push(`HTTP endpoint ${key} missing method or path`);
      }
    }

    // Validate WebSocket messages
    for (const [key, message] of Object.entries(this.apiSpec.ws)) {
      // Special case: 'slices' is not a message type but a collection of slice paths
      if (key === 'slices') {
        // Check if it's an object
        if (typeof message !== 'object' || message === null) {
          errors.push(`WebSocket slices must be an object`);
          continue;
        }
        
        // For slices, we expect it to be a record of string keys to string values
        // The actual wsApi.slices has string values like '/files', '/process', etc.
        // We'll validate that each value is a string
        for (const [sliceKey, sliceValue] of Object.entries(message)) {
          // Skip any internal properties (starting with _)
          if (sliceKey.startsWith('_')) {
            continue;
          }
          if (typeof sliceValue !== 'string') {
            errors.push(`WebSocket slice ${sliceKey} must be a string, got ${typeof sliceValue}`);
          }
        }
      } 
      // Skip entries that have a 'check' property - these are HTTP route checkers, not WebSocket messages
      else if (message.check) {
        // These are HTTP route checkers, not WebSocket messages
        // They might have a 'type' property but it's for HTTP API, not WebSocket
        // Skip validation for these
        continue;
      }
      else {
        // Regular WebSocket message validation
        if (!message.type) {
          errors.push(`WebSocket message ${key} missing type`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`API specification validation failed:\n${errors.join('\n')}`);
    }
  }

  // ========== Utility Methods ==========

  matchHttpRoute(routeName: string, method: string): string | null {
    for (const [key, endpoint] of Object.entries(this.apiSpec.http)) {
      const endpointPath = endpoint.path.replace('/~/', '');
      if (endpointPath === routeName && endpoint.method === method) {
        return key;
      }
    }
    return null;
  }

  matchWsMessageType(type: string): string | null {
    for (const [key, message] of Object.entries(this.apiSpec.ws)) {
      // Skip slices as it's not a message type
      if (key === 'slices') continue;
      
      if (message.type === type) {
        return key;
      }
    }
    return null;
  }

  getRouteHandlersConfig(): Record<string, any> {
    // This method provides configuration for route handlers
    // based on the API specification
    const config: Record<string, any> = {};

    for (const [key, endpoint] of Object.entries(this.apiSpec.http)) {
      const routeName = endpoint.path.replace('/~/', '');
      config[routeName] = {
        method: endpoint.method,
        description: endpoint.description,
        endpointKey: key
      };
    }

    return config;
  }
}
