export function filterProcessData(process: any): any {
  // Create a shallow copy with essential fields
  const filtered: any = {
    id: process.id,
    type: process.type, // Keep full type object for process detection
    label: process.label,
    status: process.status,
    icon: process.icon
  };

  // Copy other top-level fields that might be used
  if (process.description !== undefined) {
    filtered.description = process.description;
  }
  if (process.timestamp !== undefined) {
    filtered.timestamp = process.timestamp;
  }
  if (process.priority !== undefined) {
    filtered.priority = process.priority;
  }

  // Handle metadata - keep most fields but remove large nested objects
  if (process.metadata) {
    const metadata: any = {};

    // Copy all metadata except very large objects
    for (const key in process.metadata) {
      const value = process.metadata[key];

      // Skip configValue entirely as it's very large
      if (key === 'configValue') {
        // Instead of the full configValue, keep only essential parts
        if (value && typeof value === 'object') {
          metadata.configValue = {
            runtime: value.runtime,
            // Don't include tests, checks, outputs arrays
            dockerfile: value.dockerfile,
            buildOptions: value.buildOptions
          };
        }
        continue;
      }

      // Skip other potentially large arrays/objects
      if (key === 'tests' || key === 'checks' || key === 'outputs') {
        continue;
      }

      // For arrays, keep only length if they're large
      if (Array.isArray(value) && value.length > 10) {
        metadata[key] = `[Array with ${value.length} items]`;
        continue;
      }

      // For large objects, keep a simplified version
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const size = JSON.stringify(value).length;
        if (size > 1000) {
          metadata[key] = `{Object size: ${size}}`;
          continue;
        }
      }

      // Otherwise, copy the value
      metadata[key] = value;
    }

    // Ensure metadata.status is set (use top-level if not in metadata)
    if (metadata.status === undefined && process.status !== undefined) {
      metadata.status = process.status;
    }

    // Ensure container status is included
    if (process.metadata.containerStatus) {
      metadata.containerStatus = process.metadata.containerStatus;
    }
    if (process.metadata.containerId) {
      metadata.containerId = process.metadata.containerId;
    }
    if (process.metadata.containerName) {
      metadata.containerName = process.metadata.containerName;
    }
    if (process.metadata.serviceName) {
      metadata.serviceName = process.metadata.serviceName;
    }

    filtered.metadata = metadata;
  }

  return filtered;
}
