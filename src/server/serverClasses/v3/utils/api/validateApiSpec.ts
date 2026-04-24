export interface ApiSpec {
  http: Record<string, any>;
  ws: Record<string, any>;
}

export function validateApiSpec(spec: ApiSpec): string[] {
  const errors: string[] = [];

  // Validate HTTP endpoints
  for (const [key, endpoint] of Object.entries(spec.http)) {
    if (!endpoint.method || !endpoint.path) {
      errors.push(`HTTP endpoint ${key} missing method or path`);
    }
  }

  // Validate WebSocket messages
  for (const [key, message] of Object.entries(spec.ws)) {
    // Special case: 'slices' is not a message type but a collection of slice paths
    if (key === 'slices') {
      // Check if it's an object
      if (typeof message !== 'object' || message === null) {
        errors.push(`WebSocket slices must be an object`);
        continue;
      }

      // For slices, we expect it to be a record of string keys to string values
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
      continue;
    } else {
      // Regular WebSocket message validation
      if (!message.type) {
        errors.push(`WebSocket message ${key} missing type`);
      }
    }
  }

  return errors;
}
