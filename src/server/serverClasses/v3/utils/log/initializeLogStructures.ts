export function initializeLogStructures(): Map<string, any> {
  const structures = new Map<string, any>();

  // Test log structure
  structures.set('test', {
    testName: '',
    configKey: '',
    runtime: '',
    status: '',
    duration: 0,
    assertions: [],
    errors: [],
  });

  // Process log structure
  structures.set('process', {
    processId: '',
    processType: '',
    serviceName: '',
    containerId: '',
    status: '',
    startedAt: '',
    finishedAt: '',
    exitCode: null,
    logs: [],
  });

  // Docker log structure
  structures.set('docker', {
    containerId: '',
    containerName: '',
    serviceName: '',
    event: '',
    timestamp: '',
    state: '',
    exitCode: null,
  });

  // Agent log structure
  structures.set('agent', {
    agentName: '',
    action: '',
    timestamp: '',
    input: null,
    output: null,
    duration: 0,
  });

  return structures;
}
