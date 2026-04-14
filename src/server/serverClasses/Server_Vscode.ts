import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Docker } from './Server_Docker';

export class Server_Vscode extends Server_Docker {

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async start(): Promise<void> {
    await super.start();
  }

  async stop(): Promise<void> {
    await super.stop();
  }

  async startDockerProcess(
    runtime: string,
    testName: string,
    configKey: string,
    processType: 'bdd' | 'check' | 'aider' | 'builder'
  ): Promise<void> {
    // Get the runtime configuration
    const runtimeConfig = this.configs.runtimes[configKey];
    if (!runtimeConfig) {
      throw new Error(`Runtime config not found for key: ${configKey}`);
    }

    // Add process node to graph for all process types
    await this.addProcessNodeToGraph(
      processType,
      runtimeConfig.runtime as any,
      testName,
      configKey,
      runtimeConfig
    );

    // Start the appropriate service based on process type
    switch (processType) {
      case 'bdd':
        await this.launchBddTest(
          runtimeConfig.runtime as any,
          testName,
          configKey,
          runtimeConfig
        );
        break;
      case 'check':
        await this.launchChecks(
          runtimeConfig.runtime as any,
          testName,
          configKey,
          runtimeConfig
        );
        break;
      case 'aider':
        await this.launchAider(
          runtimeConfig.runtime as any,
          testName,
          configKey,
          runtimeConfig
        );
        break;
      case 'builder':
        // Builder processes are started automatically during server startup
        break;
    }

    // Update process node status for all process types
    await this.addProcessNodeToGraph(
      processType,
      runtimeConfig.runtime as any,
      testName,
      configKey,
      runtimeConfig,
      undefined,
      'running'
    );

    // Ensure graph is saved after all updates
    this.saveGraph();
    
    // Notify VSCode clients about the new process
    this.resourceChanged(`/~/process`);
    this.resourceChanged(`/~/graph`);
  }

  async connectDockerProcess(
    processId: string,
    containerId: string,
    serviceName: string
  ): Promise<{ success: boolean; message: string; connectionInfo?: any }> {
    const containerInfo = await this.getContainerInfo(serviceName);

    if (!containerInfo) {
      throw new Error(`Container not found for service: ${serviceName}`);
    }

    const isRunning = containerInfo.State?.Running === true;
    if (!isRunning) {
      throw new Error(`Container ${containerId} is not running`);
    }

    const logs = this.getProcessLogs(processId);

    const graphData = this.getGraphData();
    const processNode = graphData.nodes.find((node: any) => node.id === processId);

    if (processNode) {
      this.mergeNodeAttributes(processId, {
        metadata: {
          ...processNode.metadata,
          connected: true,
          connectionTimestamp: new Date().toISOString(),
          containerInfo: {
            id: containerId,
            name: serviceName,
            state: containerInfo.State
          }
        }
      });

      // this.saveGraph();
    }

    this.resourceChanged(`/~/process`);
    this.resourceChanged(`/~/graph`);

    return {
      success: true,
      message: `Successfully connected to Docker process ${processId}`,
      connectionInfo: {
        processId,
        containerId,
        serviceName,
        containerInfo,
        logs: logs.slice(-10)
      }
    };
  }

  async openProcessTerminal(
    nodeId: string,
    label: string,
    containerId: string,
    serviceName: string
  ): Promise<{ success: boolean; error?: string; message?: string; script?: string }> {
    // Get the process node from the graph
    const processNode = this.getProcessNode(nodeId);
    
    if (!processNode) {
      throw new Error(`Process ${nodeId} not found in graph`);
    }

    // Get container information from the process node metadata
    const metadata = processNode.metadata || {};
    
    // Use provided values or values from metadata
    let actualContainerId = containerId && containerId !== 'unknown' ? containerId : metadata.containerId;
    let actualServiceName = serviceName && serviceName !== 'unknown' ? serviceName : metadata.serviceName;

    // Special handling for agent aider processes
    // Parse nodeId to determine if this is an agent process
    // Format: aider_process:agent:prodirek
    if (nodeId.startsWith('aider_process:agent:')) {
      const parts = nodeId.split(':');
      if (parts.length >= 3) {
        const agentName = parts[2];
        // Agent containers are named like 'agent-prodirek' (from getAiderServiceName)
        actualServiceName = `agent-${agentName}`;
        
        // Check if we have container info in the graph
        const processNode = this.getProcessNode(nodeId);
        if (processNode?.metadata?.containerId) {
          actualContainerId = processNode.metadata.containerId;
        }
      }
    }

    // If we don't have a container ID, we can't proceed
    if (!actualContainerId || actualContainerId === 'unknown') {
      // Try to get container info from Docker using service name
      if (actualServiceName && actualServiceName !== 'unknown') {
        try {
          const containerInfo = await this.getContainerInfo(actualServiceName);
          if (containerInfo && containerInfo.Id) {
            actualContainerId = containerInfo.Id;
          } else {
            throw new Error(`Container info not found for service: ${actualServiceName}`);
          }
        } catch (error) {
          throw new Error(`Could not get container info for ${actualServiceName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        throw new Error(`Process ${nodeId} does not have container information in the graph and no service name was provided`);
      }
    }

    // Get container info to check if it's running
    let containerInfo;
    try {
      // Try to get container info by container ID first, then by service name
      containerInfo = await this.getContainerInfo(actualContainerId);
    } catch (error) {
      // If container ID doesn't work, try service name
      if (actualServiceName && actualServiceName !== 'unknown') {
        try {
          containerInfo = await this.getContainerInfo(actualServiceName);
        } catch (serviceError) {
          throw new Error(`Could not get container info for process ${nodeId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        throw new Error(`Could not get container info for process ${nodeId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (!containerInfo) {
      throw new Error(`Container not found for process ${nodeId}`);
    }

    const isRunning = containerInfo.State?.Running === true;
    if (!isRunning) {
      throw new Error(`Container for process ${nodeId} is not running`);
    }

    // Use the container ID from container info
    actualContainerId = containerInfo.Id || actualContainerId;
    
    // Get service name from container info or use what we have
    const containerName = containerInfo.Name ? containerInfo.Name.replace(/^\//, '') : actualServiceName;

    const script = this.generateUnifiedTerminalScript(actualContainerId, containerName || `process-${nodeId}`, label);

    return {
      success: true,
      message: `Terminal script generated for ${label}`,
      script
    };
  }

  private getBaseServiceName(configKey: string, testName: string): string {
    // Delegate to parent implementation
    const parent = this as any;
    if (parent.getBaseServiceName) {
      return parent.getBaseServiceName(configKey, testName);
    }
    // Fallback implementation
    return `base-${configKey}-${testName.replace(/\//g, '-').replace(/\./g, '-')}`;
  }

  private getBddServiceName(configKey: string, testName: string): string {
    // Delegate to parent implementation
    const parent = this as any;
    if (parent.getBddServiceName) {
      return parent.getBddServiceName(configKey, testName);
    }
    // Fallback implementation
    return `bdd-${configKey}-${testName.replace(/\//g, '-').replace(/\./g, '-')}`;
  }

  private getAiderServiceName(configKey: string, testName: string): string {
    // Handle agent processes specially
    if (configKey === 'agent') {
      // Agent containers are named like 'agent-prodirek'
      return `agent-${testName}`;
    }
    
    // Delegate to parent implementation for other aider processes
    const parent = this as any;
    if (parent.getAiderServiceName) {
      return parent.getAiderServiceName(configKey, testName);
    }
    // Fallback implementation
    return `aider-${configKey}-${testName.replace(/\//g, '-').replace(/\./g, '-')}`;
  }

  private generateUnifiedTerminalScript(containerId: string, serviceName: string, label: string): string {
    // Validate container ID
    if (!containerId || containerId === 'unknown') {
      throw new Error(`Cannot generate terminal script with invalid container ID: ${containerId}`);
    }
    
    // Generate a script that uses docker attach for all containers
    // This provides a consistent interface for both interactive and non-interactive containers
    return `#!/bin/sh
echo "Connecting to container: ${containerId}"
echo "Service: ${serviceName}"
echo "Label: ${label}"
echo ""
echo "This terminal uses 'docker attach' to connect to the container."
echo ""
echo "For interactive processes (like aider):"
echo "  - Type input directly to interact with the process"
echo "  - Use Ctrl+P, Ctrl+Q to detach without stopping the container"
echo "  - Use Ctrl+C to send interrupt signal"
echo ""
echo "For non-interactive processes:"
echo "  - You will see the container's output"
echo "  - Press Ctrl+C to exit"
echo "  - Avoid typing input unless you know the process expects it"
echo ""
echo "Attaching to container..."
exec docker attach ${containerId}
`;
  }

  async getProcessLogs(processId: string): Promise<string[]> {
    try {
      // Get logs from the graph manager
      const graphData = this.graphManager.getGraphData();
      const processNode = graphData.nodes.find((node: any) => node.id === processId);

      if (processNode && processNode.metadata && processNode.metadata.logs) {
        return processNode.metadata.logs;
      }

      // If logs aren't in the graph, try to get them from Docker
      const containerId = processNode?.metadata?.containerId;
      if (containerId) {
        // This is a simplified version - in reality, we'd need to call Docker API
        return [`Logs for container ${containerId} would be fetched here`];
      }

      return [`No logs available for process ${processId}`];
    } catch (error) {
      console.error(`[Server_Vscode] Error getting process logs:`, error);
      return [`Error getting logs: ${error}`];
    }
  }

}
