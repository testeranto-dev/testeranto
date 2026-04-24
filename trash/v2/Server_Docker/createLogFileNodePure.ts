import { createLogFileNodeOperationsPure } from "./utils/createLogFileNodeOperationsPure";

export async function createLogFileNodePure(
  logFilePath: string,
  serviceName: string,
  runtime: string,
  runtimeConfigKey: string,
  testName: string | undefined,
  graphManager: any
): Promise<void> {
  console.log(`[Server_Docker] Creating log file node for ${logFilePath} (testName: ${testName || 'undefined'})`);

  try {
    console.log(`[Server_Docker] Checking graph manager availability: ${!!graphManager}`);

    if (graphManager && typeof graphManager.applyUpdate === 'function') {
      console.log(`[Server_Docker] Graph manager available, using createLogFileNodeOperationsPure`);

      const timestamp = new Date().toISOString();
      const operations = createLogFileNodeOperationsPure(
        logFilePath,
        serviceName,
        runtime,
        runtimeConfigKey,
        testName,
        timestamp
      );

      console.log(`[Server_Docker] Generated ${operations.length} operations`);

      const update = {
        operations,
        timestamp
      };

      graphManager.applyUpdate(update);
      // graphManager.saveGraph();
    } else {
      console.warn(`[Server_Docker] Graph manager not available for creating log file node`);
    }
  } catch (error) {
    console.error(`[Server_Docker] Error creating log file node:`, error);
    // Log the full error stack for debugging
    if (error instanceof Error) {
      console.error(`[Server_Docker] Error stack:`, error.stack);
    }
  }
}
