import type { ITesterantoConfig } from "../../../src/server/Types";

export async function createProcessNodesFromConfig(
  configs: ITesterantoConfig,
  consoleLog: (message: string) => void,
  getProcessNode: (id: string) => any,
  addProcessNodeToGraph: (
    processType: string,
    runtime: any,
    testName: string,
    configKey: string,
    runtimeConfig: any,
    files?: any,
    status?: string
  ) => Promise<void>
): Promise<void> {
  consoleLog(`[Server_Docker] Creating process nodes from configuration...`);

  // For each runtime configuration
  for (const [configKey, runtimeConfig] of Object.entries(configs.runtimes)) {
    const tests = runtimeConfig.tests || [];
    const runtime = runtimeConfig.runtime;

    consoleLog(`[Server_Docker] Processing config ${configKey} with ${tests.length} tests`);

    // Create process nodes for each test
    for (const testName of tests) {
      if (typeof testName !== 'string') continue;

      // Create BDD process node
      const bddProcessId = `bdd_process:${configKey}:${testName}`;
      if (!getProcessNode(bddProcessId)) {
        await addProcessNodeToGraph(
          'bdd',
          runtime as any,
          testName,
          configKey,
          runtimeConfig,
          undefined,
          'todo' // Set initial status to 'todo' since Docker hasn't started yet
        );
      }

      // Create check process node
      const checkProcessId = `check_process:${configKey}:${testName}`;
      if (!getProcessNode(checkProcessId)) {
        await addProcessNodeToGraph(
          'check',
          runtime as any,
          testName,
          configKey,
          runtimeConfig,
          undefined,
          'todo'
        );
      }

      // Create aider process node
      const aiderProcessId = `aider_process:${configKey}:${testName}`;
      if (!getProcessNode(aiderProcessId)) {
        await addProcessNodeToGraph(
          'aider',
          runtime as any,
          testName,
          configKey,
          runtimeConfig,
          undefined,
          'todo'
        );
      }
    }

    // Create builder process node for this config
    const builderProcessId = `builder_process:${configKey}:builder`;
    if (!getProcessNode(builderProcessId)) {
      await addProcessNodeToGraph(
        'builder',
        runtime as any,
        'builder',
        configKey,
        runtimeConfig,
        undefined,
        'todo'
      );
    }
  }

  consoleLog(`[Server_Docker] Created process nodes from configuration`);
}
