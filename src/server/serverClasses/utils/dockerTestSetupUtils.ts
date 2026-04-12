import type { ITesterantoConfig } from "../../../Types";
import type { IRunTime } from "../../../Types";
import type { IMode } from "../../types";
import fs from "fs";
import { existsSync } from "fs";

export async function setupTestNodes(
  configs: ITesterantoConfig,
  mode: IMode,
  failedBuilderConfigs: Set<string>,
  graphManager: any,
  makeReportDirectory: (testName: string, configKey: string) => string,
  getTestManager: () => any,
  updateTestStatusInGraph: (graphManager: any, testName: string, status: string) => Promise<void>,
  updateEntrypointForServiceStart: (testName: string, configKey: string, serviceType: 'bdd' | 'checks' | 'aider') => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<void> {
  for (const [configKey, configValue] of Object.entries(
    configs.runtimes,
  )) {
    // Skip configs with failed builders
    if (failedBuilderConfigs.has(configKey)) {
      consoleLog(`[Server_Docker] Skipping test nodes for config ${configKey} because builder failed`);
      continue;
    }

    const runtime: IRunTime = configValue.runtime as IRunTime;
    const tests = configValue.tests;

    for (const testName of tests) {
      try {
        const reportDir = makeReportDirectory(testName, configKey);

        if (!existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
        }

        // Add test entrypoint node to graph
        const entrypointId = `entrypoint:${testName}`;
        const graphData = graphManager.getGraphData();
        const existingNode = graphData.nodes.find((n: any) => n.id === entrypointId);

        if (!existingNode) {
          // Create entrypoint node
          await graphManager.applyUpdate({
            operations: [{
              type: 'addNode',
              data: {
                id: entrypointId,
                type: 'entrypoint',
                label: testName.split('/').pop() || testName,
                description: `Test entrypoint: ${testName}`,
                status: 'todo',
                icon: 'file-text',
                metadata: {
                  configKey,
                  filePath: testName,
                  runtime,
                  timestamp: new Date().toISOString()
                }
              },
              timestamp: new Date().toISOString()
            }],
            timestamp: new Date().toISOString()
          });
        }

        // Update test status in graph to indicate it's ready
        await updateTestStatusInGraph(graphManager, testName, 'todo');

        // Mark test as needing initial services if builder succeeded
        if (mode === "dev" && !failedBuilderConfigs.has(configKey)) {
          consoleLog(`[Server_Docker] Marking test ${testName} for initial service start`);
          // Update the graph to indicate all services need to be started
          await updateEntrypointForServiceStart(testName, configKey, 'bdd');
          await updateEntrypointForServiceStart(testName, configKey, 'checks');
          await updateEntrypointForServiceStart(testName, configKey, 'aider');
        }

      } catch (error) {
        consoleError(`[Server_Docker] Error setting up test ${testName} for config ${configKey}:`, error as string);
        // Continue with other tests
      }
    }
  }
}
