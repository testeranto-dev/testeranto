import { consoleError } from "../Server_Docker/Server_Docker_Dependents";

export async function handleTestCompletedPure(
  configKey: string,
  testName: string,
  testResults: any,
  configs: any,
  updateProcessNodeStatus: (processId: string, status: 'done' | 'failed', testResults: any, timestamp: string) => void,
  getGraphData: () => any,
  updateEntrypointNode: (entrypointId: string, status: 'done' | 'failed', testResults: any, timestamp: string) => void,
  processFeaturesFromTestResults: (configKey: string, testName: string, testResults: any, timestamp: string) => Promise<void>,
  updateFromTestResults: (testResults: any) => Promise<void>,
  resourceChanged: (path: string) => void
): Promise<void> {
  let failed = false;
  if (testResults.failed !== undefined) {
    failed = testResults.failed === true;
  } else if (testResults.fails !== undefined) {
    failed = testResults.fails > 0;
  } else if (testResults.status !== undefined) {
    failed = testResults.status === 'failed';
  } else if (testResults.success !== undefined) {
    failed = !testResults.success;
  }

  const status = failed ? 'failed' : 'done';
  const timestamp = new Date().toISOString();

  const bddProcessId = `bdd_process:${configKey}:${testName}`;
  updateProcessNodeStatus(bddProcessId, status, testResults, timestamp);

  const graphData = getGraphData();
  const checkProcessNodes = graphData.nodes.filter((node: any) =>
    node.id.startsWith(`check_process:${configKey}:${testName}`)
  );

  for (const node of checkProcessNodes) {
    updateProcessNodeStatus(node.id, status, testResults, timestamp);
  }

  const aiderProcessId = `aider_process:${configKey}:${testName}`;
  updateProcessNodeStatus(aiderProcessId, status, testResults, timestamp);

  const entrypointId = `entrypoint:${testName}`;
  updateEntrypointNode(entrypointId, status, testResults, timestamp);

  await processFeaturesFromTestResults(configKey, testName, testResults, timestamp);
  
  try {
    await updateFromTestResults({
      ...testResults,
      configKey,
      testName,
      runtime: configs.runtimes[configKey]?.runtime || 'node'
    });
  } catch (error) {
    consoleError(`[Server_Docker_Test] Error updating graph with test results:`, error);
  }

  resourceChanged(`/~/tests/${configKey}/${testName}/completed`);
  resourceChanged('/~/graph');
}
