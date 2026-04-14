import type { ITesterantoConfig } from "../../../Types";
import type { IRunTime } from "../../../Types";
import type { IMode } from "../../types";
import type { GraphUpdate, GraphOperation } from "../../../graph";
import fs from "fs";
import { existsSync } from "fs";

export async function setupTestNodes(
  configs: ITesterantoConfig,
  mode: IMode,
  failedBuilderConfigs: Set<string>,
  makeReportDirectory: (testName: string, configKey: string) => string,
  getTestManager: () => any,
  updateTestStatusInGraph: (testName: string, status: string) => Promise<GraphUpdate>,
  updateEntrypointForServiceStart: (testName: string, configKey: string, serviceType: 'bdd' | 'checks' | 'aider') => Promise<GraphUpdate>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void
): Promise<GraphUpdate[]> {
  const updates: GraphUpdate[] = [];
  
  for (const [configKey, configValue] of Object.entries(
    configs.runtimes,
  )) {
    if (failedBuilderConfigs.has(configKey)) {
      continue;
    }

    const runtime: IRunTime = configValue.runtime as IRunTime;
    const tests = configValue.tests;

    for (const testName of tests) {
      const reportDir = makeReportDirectory(testName, configKey);

      if (!existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      // Create entrypoint node operation
      const entrypointId = `entrypoint:${testName}`;
      const timestamp = new Date().toISOString();
      
      const entrypointOperation: GraphOperation = {
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
            timestamp
          }
        },
        timestamp
      };

      updates.push({
        operations: [entrypointOperation],
        timestamp
      });

      // Get status update
      const statusUpdate = await updateTestStatusInGraph(testName, 'todo');
      updates.push(statusUpdate);

      if (mode === "dev" && !failedBuilderConfigs.has(configKey)) {
        const bddUpdate = await updateEntrypointForServiceStart(testName, configKey, 'bdd');
        updates.push(bddUpdate);
        
        const checksUpdate = await updateEntrypointForServiceStart(testName, configKey, 'checks');
        updates.push(checksUpdate);
        
        const aiderUpdate = await updateEntrypointForServiceStart(testName, configKey, 'aider');
        updates.push(aiderUpdate);
      }
    }
  }
  
  return updates;
}
