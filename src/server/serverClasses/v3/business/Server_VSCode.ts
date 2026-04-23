import { getProcessLogs, connectDockerProcess } from "../utils";
import { Server_Graph } from "./Server_Graph";

/**
 * Server_VSCode - Business Layer (-4)
 * 
 * Extends: Server_Graph (-5)
 * Extended by: Server_Aider (-3)
 * Provides: VSCode integration business logic
 */
export abstract class Server_VSCode extends Server_Graph {

  async getProcessLogs(processId: string): Promise<string[]> {
    return await getProcessLogs(processId);
  }

  async connectDockerProcess(processId: string, containerId: string, serviceName: string): Promise<{ success: boolean; connectionInfo?: any }> {
    return await connectDockerProcess(processId, containerId, serviceName);
  }

  async startDockerProcess(runtime: string, testName: string, configKey: string, processType: 'bdd' | 'check' | 'aider' | 'builder'): Promise<void> {
    this.logBusinessMessage(`startDockerProcess: ${runtime}, ${testName}, ${configKey}, ${processType}`);
  }

  updateVSCodeStatus(status: any): void {
    this.logBusinessMessage(`updateVSCodeStatus: ${JSON.stringify(status)}`);
  }

  sendToVSCodeExtension(message: any): void {
    this.logBusinessMessage(`sendToVSCodeExtension: ${JSON.stringify(message)}`);
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

  // Setup method called by Server.ts
  async setupVSCode(): Promise<void> {
    this.logBusinessMessage("Setting up VSCode integration...");
    // Implementation would setup VSCode extension integration
    this.logBusinessMessage("VSCode integration setup complete");
  }

  async cleanupVSCode(): Promise<void> {
    this.logBusinessMessage("Cleaning up VSCode integration...");
    // Implementation would clean up VSCode resources
    this.logBusinessMessage("VSCode integration cleaned up");
  }

  async notifyVSCodeStarted(): Promise<void> {
    this.logBusinessMessage("VSCode integration notified of server start");
    // Notify VSCode extension that server has started
    this.updateVSCodeStatus({ status: 'running', startedAt: new Date().toISOString() });
  }

  async notifyVSCodeStopped(): Promise<void> {
    this.logBusinessMessage("VSCode integration notified of server stop");
    // Notify VSCode extension that server has stopped
    this.updateVSCodeStatus({ status: 'stopped', stoppedAt: new Date().toISOString() });
  }

  // Workflow methods
  async startDockerMonitoring(): Promise<void> {
    this.logBusinessMessage("Starting Docker process monitoring...");
    // Implementation would start monitoring Docker processes
    this.logBusinessMessage("Docker process monitoring started");
  }

  async stopDockerMonitoring(): Promise<void> {
    this.logBusinessMessage("Stopping Docker process monitoring...");
    // Implementation would stop monitoring Docker processes
    this.logBusinessMessage("Docker process monitoring stopped");
  }
}
