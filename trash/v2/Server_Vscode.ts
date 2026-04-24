import type { ITesterantoConfig } from "../../src/Types";
import type { IMode } from "../../src/server/types";
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
  ): Promise<{ success: boolean; error?: string; message?: string; command?: string; containerId?: string; serviceName?: string }> {
    const processNode = this.getProcessNode(nodeId);

    if (!processNode) {
      throw new Error(`Process ${nodeId} not found in graph`);
    }

    const metadata = processNode.metadata || {};

    const actualContainerId = containerId && containerId !== 'unknown' ? containerId : metadata.containerId;
    const actualServiceName = serviceName && serviceName !== 'unknown' ? serviceName : metadata.serviceName;

    if (!actualContainerId || actualContainerId === 'unknown') {
      throw new Error(`Process ${nodeId} does not have container information in the graph and no containerId was provided`);
    }

    const containerInfo = await this.getContainerInfo(actualContainerId);

    if (!containerInfo) {
      throw new Error(`Container not found for process ${nodeId}`);
    }

    const isRunning = containerInfo.State?.Running === true;
    if (!isRunning) {
      throw new Error(`Container for process ${nodeId} is not running`);
    }

    const containerName = containerInfo.Name ? containerInfo.Name.replace(/^\//, '') : actualServiceName;
    const isAiderProcess = this.determineIfAiderProcess(processNode);

    const command = this.generateTerminalCommand(actualContainerId, containerName || `process-${nodeId}`, label, isAiderProcess);

    return {
      success: true,
      message: `Terminal command generated for ${label}`,
      command,
      containerId: actualContainerId,
      serviceName: containerName
    };
  }

  private getBaseServiceName(configKey: string, testName: string): string {
    const parent = this as any;
    if (!parent.getBaseServiceName) {
      throw new Error('getBaseServiceName not implemented in parent class');
    }
    return parent.getBaseServiceName(configKey, testName);
  }

  private getBddServiceName(configKey: string, testName: string): string {
    const parent = this as any;
    if (!parent.getBddServiceName) {
      throw new Error('getBddServiceName not implemented in parent class');
    }
    return parent.getBddServiceName(configKey, testName);
  }

  private getAiderServiceName(configKey: string, testName: string): string {
    const parent = this as any;
    if (!parent.getAiderServiceName) {
      throw new Error('getAiderServiceName not implemented in parent class');
    }
    return parent.getAiderServiceName(configKey, testName);
  }

  private generateTerminalCommand(containerId: string, serviceName: string, label: string, isAiderProcess: boolean): string {
    // Validate container ID
    if (!containerId || containerId === 'unknown') {
      throw new Error(`Cannot generate terminal command with invalid container ID: ${containerId}`);
    }

    if (isAiderProcess) {
      // For aider containers, use docker attach to connect to the running aider process
      return `stty sane && printf '\\e[?2004l' && printf '\\e[?1l' && stty cooked && docker attach ${containerId}`;
    } else {
      // For non-aider containers, use docker exec -it for a shell
      return `stty sane && printf '\\e[?2004l' && printf '\\e[?1l' && stty cooked && docker exec -it ${containerId} /bin/sh`;
    }
  }

  async getProcessLogs(processId: string): Promise<string[]> {
    const graphData = this.graphManager.getGraphData();
    const processNode = graphData.nodes.find((node: any) => node.id === processId);

    if (processNode?.metadata?.logs) {
      return processNode.metadata.logs;
    }

    const containerId = processNode?.metadata?.containerId;
    if (containerId) {
      return [`Logs for container ${containerId} would be fetched here`];
    }

    return [`No logs available for process ${processId}`];
  }

  private determineIfAiderProcess(processNode: any): boolean {
    if (!processNode?.type) return false;
    if (typeof processNode.type === 'object' && processNode.type.type === 'aider') {
      return true;
    }
    return false;
  }
}
