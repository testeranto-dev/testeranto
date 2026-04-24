/**
 * Parse a Docker event and extract metadata (containerId, action, serviceName, processType, configKey, testName).
 * Pure business logic – no I/O.
 */
export function parseDockerEvent(event: any): {
  containerId: string;
  action: string;
  serviceName: string;
  processType: 'bdd' | 'check' | 'aider' | 'builder' | 'agent' | 'unknown';
  configKey: string;
  testName: string;
} {
  const containerId = event.id || event.Actor?.ID || '';
  const action = event.Action || event.status || '';

  // Try to get the service name from docker-compose attributes first
  // For docker run containers, use the container name from Actor.Attributes.name
  const composeService = event.Actor?.Attributes?.['com.docker.compose.service'];
  const containerName = event.Actor?.Attributes?.name || '';
  const serviceName = composeService || containerName || containerId;

  // Determine the process type from the service name
  let processType: 'bdd' | 'check' | 'aider' | 'builder' | 'agent' | 'unknown' = 'unknown';
  if (serviceName.includes('-bdd')) processType = 'bdd';
  else if (serviceName.includes('-check-')) processType = 'check';
  else if (serviceName.includes('-aider')) processType = 'aider';
  else if (serviceName.startsWith('agent-')) processType = 'agent';
  else if (serviceName.includes('-builder')) processType = 'builder';

  // Extract configKey and testName from service name
  let configKey = '';
  let testName = '';
  if (processType === 'agent') {
    configKey = 'agent';
    testName = serviceName.replace('agent-', '');
  } else if (processType !== 'unknown') {
    const parts = serviceName.split('-');
    configKey = parts[0];
    testName = serviceName.substring(configKey.length + 1);
  }

  return { containerId, action, serviceName, processType, configKey, testName };
}
