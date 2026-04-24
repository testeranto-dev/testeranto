import type { Server_Graph } from "../Server_Graph";
import type { GraphOperation } from "../../../graph";
import { updateGraphWithInputFilesPure } from "../utils/updateGraphWithInputFilesPure";

export async function informAiderDockerUtil(
  graphManager: Server_Graph,
  testName: string,
  configKey: string,
  getAiderServiceName: (configKey: string, testName: string) => string,
  restartDockerService: (serviceName: string) => Promise<void>,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void,
  files?: any,
  runtime?: string
): Promise<void> {
  consoleLog(`[informAiderDockerUtil] Input files changed for ${testName}, updating aider in graph and restarting service`);

  const timestamp = new Date().toISOString();
  const entrypointId = `entrypoint:${testName}`;
  const graphData = graphManager.getGraphData();
  const existingNode = graphData.nodes.find((n: any) => n.id === entrypointId);

  const operations: GraphOperation[] = [];

  // Update entrypoint node
  if (existingNode) {
    operations.push({
      type: 'updateNode',
      data: {
        id: entrypointId,
        status: 'doing',
        metadata: {
          ...existingNode.metadata,
          filesUpdated: timestamp,
          files: files
        }
      },
      timestamp
    });
  }

  // Update aider_process node status to indicate restarting
  const aiderProcessId = `aider_process:${configKey}:${testName}`;
  const aiderProcessNode = graphData.nodes.find((n: any) => n.id === aiderProcessId);

  if (aiderProcessNode) {
    operations.push({
      type: 'updateNode',
      data: {
        id: aiderProcessId,
        status: 'restarting',
        metadata: {
          ...aiderProcessNode.metadata,
          filesUpdated: timestamp,
          restartingAt: timestamp
        }
      },
      timestamp
    });
  }

  // Apply operations
  if (operations.length > 0) {
    await graphManager.applyUpdate({
      operations,
      timestamp
    });
  }

  // If files are provided, create file and folder nodes for them
  if (files && Array.isArray(files)) {
    consoleLog(`[informAiderDockerUtil] Creating file and folder nodes for ${files.length} input files:`, files);
    try {
      await updateGraphWithInputFilesPure(
        runtime || 'node', // Use provided runtime or default to 'node'
        testName,
        configKey,
        files,
        graphManager,
        consoleLog,
        consoleError,
        console.warn
      );
      consoleLog(`[informAiderDockerUtil] Successfully created file and folder nodes for input files`);

      // Log the current graph state to verify nodes were added
      const graphData = graphManager.getGraphData();
      const fileNodes = graphData.nodes.filter((n: any) => n.type === 'file');
      const folderNodes = graphData.nodes.filter((n: any) => n.type === 'folder');
      consoleLog(`[informAiderDockerUtil] Graph now has ${fileNodes.length} file nodes and ${folderNodes.length} folder nodes`);
    } catch (error) {
      consoleError(`[informAiderDockerUtil] Error creating file and folder nodes:`, error);
      // Don't throw - continue with restarting the service
    }
  } else {
    consoleLog(`[informAiderDockerUtil] No files provided or files is not an array:`, files);
  }

  // Restart the aider service to pick up changes
  const aiderServiceName = getAiderServiceName(configKey, testName);
  consoleLog(`[informAiderDockerUtil] Restarting aider service: ${aiderServiceName}`);
  try {
    await restartDockerService(aiderServiceName);

    // Update aider_process node status back to running after successful restart
    if (aiderProcessNode) {
      await graphManager.applyUpdate({
        operations: [{
          type: 'updateNode',
          data: {
            id: aiderProcessId,
            status: 'running',
            metadata: {
              ...aiderProcessNode.metadata,
              restartedAt: new Date().toISOString()
            }
          },
          timestamp: new Date().toISOString()
        }],
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    consoleError(`[informAiderDockerUtil] Failed to restart service ${aiderServiceName}:`, error);

    // Update aider_process node status to failed
    if (aiderProcessNode) {
      await graphManager.applyUpdate({
        operations: [{
          type: 'updateNode',
          data: {
            id: aiderProcessId,
            status: 'failed',
            metadata: {
              ...aiderProcessNode.metadata,
              error: error instanceof Error ? error.message : String(error),
              restartFailedAt: new Date().toISOString()
            }
          },
          timestamp: new Date().toISOString()
        }],
        timestamp: new Date().toISOString()
      });
    }

    throw error;
  }
}
