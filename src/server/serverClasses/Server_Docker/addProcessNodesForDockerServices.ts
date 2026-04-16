import type { ITesterantoConfig } from "../../../Types";
import { generateProcessNodesFromServicesPure } from "./generateProcessNodesFromServicesPure";

export async function addProcessNodesForDockerServices(
  services: Record<string, any>,
  configs: ITesterantoConfig,
  consoleLog: (message: string) => void,
  getProcessNode: (id: string) => any,
  applyUpdate: (update: any) => void,
  saveGraph: () => void,
  createProcessNodesFromConfig: () => Promise<void>
): Promise<void> {
  consoleLog(`[Server_Docker] Found ${Object.keys(services).length} Docker services to add as process nodes`);

  // Use pure function to generate operations
  const { operations, processInfos } = generateProcessNodesFromServicesPure(services, configs);

  // Apply operations to the graph
  for (const operation of operations) {
    // Check if process node already exists
    const processId = operation.data.id;
    if (getProcessNode(processId)) {
      consoleLog(`[Server_Docker] Process node already exists: ${processId}`);
      continue;
    }

    // Apply the operation
    applyUpdate({
      operations: [operation],
      timestamp: operation.timestamp
    });
  }

  // Also create process nodes for all tests from configuration
  // This ensures we have process nodes even before Docker starts
  await createProcessNodesFromConfig();

  // Save the graph after adding all process nodes
  saveGraph();
  consoleLog("[Server_Docker] Graph saved with Docker service process nodes");
}
