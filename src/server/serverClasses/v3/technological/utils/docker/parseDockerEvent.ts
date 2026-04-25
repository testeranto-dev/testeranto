export interface ParsedDockerEvent {
  containerId: string;
  action: string;
  serviceName: string;
  processType: string;
  configKey: string;
  testName: string;
}

export function parseDockerEvent(event: any): ParsedDockerEvent | null {
  if (!event) {
    return null;
  }

  // Docker events can come in different formats
  // Format 1: { Type: "container", Action: "start", Actor: { ID: "abc123", Attributes: { name: "service-name" } } }
  // Format 2: { status: "start", id: "abc123", Type: "container", Action: "start" }

  const containerId = event.id || event.Actor?.ID || event.containerId || '';
  const action = event.Action || event.status || '';
  const eventType = event.Type || event.Type || '';

  if (!containerId || !action) {
    return null;
  }

  // Only process container events, ignore network, image, volume, etc.
  if (eventType !== 'container') {
    return null;
  }

  // Extract service name from container name or labels
  const containerName = event.Actor?.Attributes?.name || event.from || '';
  const serviceName = containerName.replace(/^\//, '');

  // Determine process type based on container name patterns
  let processType = 'docker_process';
  let configKey = 'unknown';
  let testName = 'unknown';

  if (serviceName.startsWith('agent-')) {
    // Agent containers: agent-{profile}-{counter}
    processType = 'aider';
    // Extract agent profile name (e.g., agent-spawn-12 -> profile=spawn)
    const parts = serviceName.split('-');
    // parts[0] = 'agent', parts[1] = profile name, parts[2] = counter
    configKey = parts[1] || 'unknown';
    testName = serviceName; // Use full service name as testName for uniqueness
  } else if (serviceName.includes('aider')) {
    processType = 'aider';
    // Extract configKey and testName from service name
    // Service names follow pattern: {configKey}-{testName}-{type}
    const parts = serviceName.split('-');
    configKey = parts[0] || 'unknown';
    testName = parts.slice(1, -1).join('-') || 'unknown';
  } else if (serviceName.includes('bdd')) {
    processType = 'bdd';
    const parts = serviceName.split('-');
    configKey = parts[0] || 'unknown';
    testName = parts.slice(1, -1).join('-') || 'unknown';
  } else if (serviceName.includes('check')) {
    processType = 'check';
    const parts = serviceName.split('-');
    configKey = parts[0] || 'unknown';
    testName = parts.slice(1, -1).join('-') || 'unknown';
  } else if (serviceName.includes('builder')) {
    processType = 'builder';
    const parts = serviceName.split('-');
    configKey = parts[0] || 'unknown';
    testName = parts.slice(1, -1).join('-') || 'unknown';
  }

  return {
    containerId,
    action,
    serviceName,
    processType,
    configKey,
    testName,
  };
}
