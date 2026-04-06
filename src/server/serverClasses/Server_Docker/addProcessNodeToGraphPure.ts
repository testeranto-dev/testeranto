import type { IRunTime } from "../../../Types";

export async function addProcessNodeToGraphPure(
  processType: 'bdd' | 'check' | 'aider' | 'builder',
  runtime: IRunTime,
  testName: string,
  configKey: string,
  configValue: any,
  checkIndex: number | undefined,
  graphManager: any,
  consoleLog: (message: string) => void,
  consoleError: (message: string, error?: any) => void,
  consoleWarn: (message: string) => void
): Promise<void> {
  consoleLog(`[Server_Docker] addProcessNodeToGraph called: ${processType} for ${testName} (${configKey})`);
  try {
    consoleLog(`[Server_Docker] graphManager exists: ${!!graphManager}`);
    consoleLog(`[Server_Docker] graphManager.applyUpdate is function: ${typeof graphManager?.applyUpdate === 'function'}`);

    if (graphManager && typeof graphManager.applyUpdate === 'function') {
      // Generate process ID
      let processId: string;
      let label: string;

      switch (processType) {
        case 'bdd':
          processId = `bdd_process:${configKey}:${testName}`;
          label = `BDD Process: ${testName}`;
          break;
        case 'check':
          processId = `check_process:${configKey}:${testName}:${checkIndex}`;
          label = `Check Process ${checkIndex}: ${testName}`;
          break;
        case 'aider':
          processId = `aider_process:${configKey}:${testName}`;
          label = `Aider Process: ${testName}`;
          break;
        case 'builder':
          processId = `builder_process:${configKey}`;
          label = `Builder Process: ${configKey}`;
          break;
        default:
          return;
      }

      const timestamp = new Date().toISOString();
      const operations = [];

      // Create process node operation
      const nodeAttributes = {
        id: processId,
        type: processType === 'bdd' ? 'bdd_process' :
          processType === 'check' ? 'check_process' :
            processType === 'aider' ? 'aider_process' : 'builder_process',
        label: label,
        description: `${processType} process for ${testName} (${configKey})`,
        status: 'running',
        priority: 'medium',
        metadata: {
          runtime,
          testName,
          configKey,
          processType,
          checkIndex,
          timestamp
        }
      };

      operations.push({
        type: 'addNode',
        data: nodeAttributes,
        timestamp
      });

      // Create edge from entrypoint to process (for non-builder processes)
      if (processType !== 'builder') {
        const entrypointId = `entrypoint:${testName}`;
        const edgeType = processType === 'bdd' ? 'hasBddProcess' :
          processType === 'check' ? 'hasCheckProcess' :
            processType === 'aider' ? 'hasAiderProcess' : 'hasBuilderProcess';

        operations.push({
          type: 'addEdge',
          data: {
            source: entrypointId,
            target: processId,
            attributes: {
              type: edgeType,

              timestamp
            }
          },
          timestamp
        });
      } else {
        // For builder processes, first ensure config node exists
        const configNodeId = `config:${configKey}`;

        // Check if config node exists by trying to get it from the graph
        // We need to check if the node exists in the current graph data
        const graphData = graphManager.getGraphData();
        const configNodeExists = graphData.nodes.some((node: any) => node.id === configNodeId);

        if (!configNodeExists) {
          const configNodeAttributes = {
            id: configNodeId,
            type: 'config' as const,
            label: `Config: ${configKey}`,
            description: `Configuration for ${configKey}`,
            status: 'todo',
            priority: 'medium',
            metadata: {
              configKey,
              runtime: configValue.runtime,
              timestamp
            }
          };
          operations.push({
            type: 'addNode',
            data: configNodeAttributes,
            timestamp
          });
          consoleLog(`[Server_Docker] Created config node: ${configNodeId}`);
        }

        // Link builder process to config node
        operations.push({
          type: 'addEdge',
          data: {
            source: configNodeId,
            target: processId,
            attributes: {
              type: 'hasBuilderProcess',

              timestamp
            }
          },
          timestamp
        });
      }

      // Apply all operations at once
      const update = {
        operations,
        timestamp
      };

      graphManager.applyUpdate(update);
      consoleLog(`[Server_Docker] Added ${processType} process node to graph: ${processId}`);

      // Save the graph data after adding process nodes
      if (typeof graphManager.saveGraph === 'function') {
        graphManager.saveGraph();
        consoleLog(`[Server_Docker] Saved graph after adding ${processType} process node`);

        // Also save to graph-data.json
        if (typeof (graphManager as any).saveCurrentGraph === 'function') {
          try {
            (graphManager as any).saveCurrentGraph();
            consoleLog(`[Server_Docker] Updated graph-data.json with ${processType} process node`);
          } catch (error) {
            consoleError(`[Server_Docker] Error saving graph-data.json:`, error);
          }
        }
      }

      // Broadcast graph update via WebSocket if available
      if ((graphManager as any).broadcast && typeof (graphManager as any).broadcast === 'function') {
        (graphManager as any).broadcast({
          type: 'graphUpdated',
          message: `Graph updated with ${processType} process node`,
          timestamp: new Date().toISOString(),
          data: {
            nodeAdded: processId,
            processType,
            testName,
            configKey
          }
        });
      }
    } else {
      consoleLog(`[Server_Docker] Graph manager or applyUpdate not available`);
    }
  } catch (error: any) {
    consoleError(`[Server_Docker] Error adding process node to graph:`, error);
  }
}