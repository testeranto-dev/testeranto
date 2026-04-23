import { exec, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_Api } from "./Server_Api";
import { generateAgentService } from "./utils/generateAgentService";
import { generateAiderService } from "./utils/generateAiderService";
import { generateBddService } from "./utils/generateBddService";
import { generateBuilderService } from "./utils/generateBuilderService";
import { generateCheckService } from "./utils/generateCheckService";
import { generateServiceName } from "./utils/generateServiceName";
import { generateYaml } from "./utils/generateYaml";
import { yamlValueToString } from './utils/yamlValueToString';

const execAsync = promisify(exec);

export class Server_DockerCompose extends Server_Api {
  private dockerEventsCleanup: (() => void) | null = null;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async dockerComposeUp(services?: string[]): Promise<void> {
    const serviceArgs = services ? services.join(' ') : '';
    const composePath = `testeranto/docker-compose.yml`;
    const command = `docker compose -f "${composePath}" up -d ${serviceArgs}`.trim();

    try {
      const { stdout, stderr } = await execAsync(command);
      console.log(`[Server_DockerCompose] dockerComposeUp: ${stdout}`);
      if (stderr) console.error(`[Server_DockerCompose] dockerComposeUp stderr: ${stderr}`);
    } catch (error: any) {
      console.error(`[Server_DockerCompose] dockerComposeUp failed: ${error.message}`);
      throw error;
    }
  }

  async dockerComposeDown(): Promise<void> {
    const composePath = `testeranto/docker-compose.yml`;
    const command = `docker compose -f "${composePath}" down`;


    console.log(`[Server_DockerCompose] ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command);
      console.log(`[Server_DockerCompose] dockerComposeDown: ${stdout}`);
      if (stderr) console.error(`[Server_DockerCompose] dockerComposeDown stderr: ${stderr}`);
    } catch (error: any) {
      console.error(`[Server_DockerCompose] dockerComposeDown failed: ${error.message}`);
      throw error;
    }
  }

  async dockerComposeDownThenUp(): Promise<void> {
    this.logBusinessMessage("Bringing down all Docker services...");
    await this.dockerComposeDown();
    this.logBusinessMessage("Bringing up all Docker services...");
    await this.dockerComposeUp();
    this.logBusinessMessage("Docker services restarted");
  }

  // Add logBusinessMessage for compatibility
  protected logBusinessMessage(message: string): void {
    console.log(`[Business] ${message}`);
  }

  // Implement graph methods that may be called
  protected addNode(node: any): string {
    // This is a stub implementation
    // In reality, this would be provided by Server_Graph
    const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[Server_DockerCompose] addNode stub: ${nodeId}`, node);
    return nodeId;
  }

  protected getProcessNode(nodeId: string): any {
    // Stub implementation
    console.log(`[Server_DockerCompose] getProcessNode stub: ${nodeId}`);
    return null;
  }

  protected determineIfAiderProcess(processNode: any): boolean {
    // Stub implementation
    return processNode?.metadata?.processType === 'aider';
  }

  protected generateTerminalCommand(containerId: string, containerName: string, label: string, isAiderProcess: boolean): string {
    // Stub implementation
    if (isAiderProcess) {
      return `docker exec -it ${containerId} aider`;
    } else {
      return `docker exec -it ${containerId} /bin/bash`;
    }
  }

  // V2 Server_Docker.start() business logic: setup Docker Compose, bring down then up
  async setupDockerCompose(): Promise<void> {
    this.logBusinessMessage("Setting up Docker Compose (V2 business logic)...");

    // Generate services based on configs
    const services = this.generateServices();

    // Write docker-compose.yml file
    await this.writeComposeFile(services);

    this.logBusinessMessage("Docker Compose setup complete");
  }

  // Generate services based on configs (similar to V2 Server_Docker_Compose.generateServices())
  private generateServices(): Record<string, any> {
    this.logBusinessMessage("Generating Docker Compose services from configs...");

    const services: Record<string, any> = {};

    // Add builder services
    for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
      const builderServiceName = `${configKey}-builder`;
      services[builderServiceName] = this.generateBuilderService(configKey, configValue);
    }

    // Add test services (BDD, aider, checks)
    for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
      if (configValue.tests) {
        for (const testName of configValue.tests) {
          // BDD service
          const bddServiceName = this.generateServiceName(configKey, testName, 'bdd');
          services[bddServiceName] = this.generateBddService(configKey, configValue, testName);

          // Aider service
          const aiderServiceName = this.generateServiceName(configKey, testName, 'aider');
          services[aiderServiceName] = this.generateAiderService(configKey, configValue, testName);

          // Check services (if checks exist)
          if (configValue.checks && configValue.checks.length > 0) {
            for (let i = 0; i < configValue.checks.length; i++) {
              const checkServiceName = this.generateServiceName(configKey, testName, `check-${i}`);
              services[checkServiceName] = this.generateCheckService(configKey, configValue, testName, i);
            }
          }
        }
      }
    }

    // Add agent services
    if (this.configs.agents) {
      for (const [agentName, agentConfig] of Object.entries(this.configs.agents)) {
        const agentServiceName = `agent-${agentName}`;
        services[agentServiceName] = this.generateAgentService(agentName, agentConfig);
      }
    }

    // Add network
    services.networks = {
      allTests_network: {
        driver: 'bridge'
      }
    };

    this.logBusinessMessage(`Generated ${Object.keys(services).length} services`);
    return services;
  }

  // Generate service name similar to V2
  private generateServiceName(configKey: string, testName: string, type: string): string {
    return generateServiceName(configKey, testName, type);
  }

  // Generate builder service configuration
  private generateBuilderService(configKey: string, configValue: any): any {
    return generateBuilderService(configKey, configValue, this.mode);
  }

  // Generate BDD service configuration
  private generateBddService(configKey: string, configValue: any, testName: string): any {
    return generateBddService(configKey, configValue, testName);
  }

  // Generate aider service configuration
  private generateAiderService(configKey: string, configValue: any, testName: string): any {
    return generateAiderService(configKey, configValue, testName);
  }

  // Generate check service configuration
  private generateCheckService(configKey: string, configValue: any, testName: string, checkIndex: number): any {
    return generateCheckService(configKey, configValue, testName, checkIndex);
  }

  // Generate agent service configuration
  private generateAgentService(agentName: string, agentConfig: any): any {
    return generateAgentService(agentName, agentConfig, this.mode);
  }

  // Write docker-compose.yml file
  private async writeComposeFile(services: Record<string, any>): Promise<void> {
    const composePath = `${process.cwd()}/testeranto/docker-compose.yml`;
    this.logBusinessMessage(`Writing docker-compose.yml to ${composePath}`);

    // Create YAML content
    const yamlContent = this.generateYaml(services);

    const dir = path.dirname(composePath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }

    // Write file
    await fs.writeFile(composePath, yamlContent, 'utf-8');
    this.logBusinessMessage(`docker-compose.yml written successfully`);
  }

  // Generate YAML from services object
  private generateYaml(services: Record<string, any>): string {
    return generateYaml(services);
  }

  // Convert value to YAML string representation
  private yamlValueToString(value: any): string {
    return yamlValueToString(value);
  }

  // V2 Server_Docker.start() business logic: add process nodes for Docker services
  async addProcessNodesForDockerServices(): Promise<void> {
    this.logBusinessMessage("Adding process nodes for Docker services...");

    // Get all services from the generated docker-compose.yml
    const services = this.generateServices();

    // For each service, add a process node to the graph
    for (const [serviceName, serviceConfig] of Object.entries(services)) {
      if (serviceName === 'networks') continue;

      // Determine process type based on service name
      let processType: 'bdd' | 'check' | 'aider' | 'builder' | 'agent' = 'builder';
      if (serviceName.includes('-bdd')) processType = 'bdd';
      else if (serviceName.includes('-check-')) processType = 'check';
      else if (serviceName.includes('-aider')) processType = 'aider';
      else if (serviceName.startsWith('agent-')) processType = 'agent';

      // Extract configKey and testName from service name
      let configKey = '';
      let testName = '';

      if (processType === 'agent') {
        configKey = 'agent';
        testName = serviceName.replace('agent-', '');
      } else {
        // Parse service name like "nodetests-src_lib_tiposkripto_tests_abstractbase-test_index-ts-bdd"
        const parts = serviceName.split('-');
        configKey = parts[0];
        // Reconstruct test name (simplified)
        testName = serviceName.substring(configKey.length + 1);
      }

      // Add process node to graph
      // Note: We need to access the graph methods from parent classes
      // Since Server_DockerCompose extends Server_WS_HTTP which extends Server_HTTP, etc.
      // and Server_Graph has addNode method
      try {
        // Use the graph methods from the inheritance chain
        const nodeId = this.addNode({
          type: 'process',
          label: serviceName,
          metadata: {
            serviceName,
            processType,
            configKey,
            testName,
            status: 'running'
          }
        });
        this.logBusinessMessage(`Added process node: ${nodeId} for service ${serviceName}`);
      } catch (error) {
        this.logBusinessMessage(`Error adding process node for ${serviceName}: ${error}`);
      }
    }

    this.logBusinessMessage("Process nodes added for Docker services");
  }

  // V2 Server_Docker.start() business logic: wait for containers and add process nodes
  async waitForContainersAndAddProcessNodes(): Promise<void> {
    this.logBusinessMessage("Waiting for containers and adding process nodes...");

    // Wait for containers to start (simplified)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Update process nodes with container information
    const services = this.generateServices();

    for (const [serviceName] of Object.entries(services)) {
      if (serviceName === 'networks') continue;

      try {
        const containerInfo = await this.getContainerInfo(serviceName);
        if (containerInfo) {
          // Find the process node for this service
          // This is simplified - in reality we'd need to query the graph
          this.logBusinessMessage(`Container ${serviceName} started with ID: ${containerInfo.id}`);
        }
      } catch (error) {
        // Container may not be ready yet
        this.logBusinessMessage(`Container ${serviceName} not ready yet`);
      }
    }

    this.logBusinessMessage("Containers processed and nodes added");
  }

  async dockerComposeStart(services?: string[]): Promise<void> {
    const serviceArgs = services ? services.join(' ') : '';
    const composePath = `${process.cwd()}/testeranto/docker-compose.yml`;
    const command = `docker compose -f "${composePath}" start ${serviceArgs}`.trim();

    console.log(`[Server_DockerCompose] dockerComposeStart: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command);
      console.log(`[Server_DockerCompose] dockerComposeStart: ${stdout}`);
      if (stderr) console.error(`[Server_DockerCompose] dockerComposeStart stderr: ${stderr}`);
    } catch (error: any) {
      console.error(`[Server_DockerCompose] dockerComposeStart failed: ${error.message}`);
      throw error;
    }
  }

  async dockerComposeStop(services?: string[]): Promise<void> {
    const serviceArgs = services ? services.join(' ') : '';
    const composePath = `${process.cwd()}/testeranto/docker-compose.yml`;
    const command = `docker compose -f "${composePath}" stop ${serviceArgs}`.trim();

    console.log(`[Server_DockerCompose] dockerComposeStop: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command);
      console.log(`[Server_DockerCompose] dockerComposeStop: ${stdout}`);
      if (stderr) console.error(`[Server_DockerCompose] dockerComposeStop stderr: ${stderr}`);
    } catch (error: any) {
      console.error(`[Server_DockerCompose] dockerComposeStop failed: ${error.message}`);
      throw error;
    }
  }

  async getContainerInfo(serviceName: string): Promise<any> {
    const composePath = `${process.cwd()}/testeranto/docker-compose.yml`;
    const command = `docker compose -f "${composePath}" ps -q ${serviceName}`;

    try {
      const { stdout } = await execAsync(command);
      const containerId = stdout.trim();

      if (!containerId) {
        throw new Error(`Service ${serviceName} not found or not running`);
      }

      const inspectCommand = `docker inspect ${containerId}`;
      const { stdout: inspectStdout } = await execAsync(inspectCommand);
      const containerInfo = JSON.parse(inspectStdout)[0];

      return {
        id: containerInfo.Id,
        name: containerInfo.Name.replace(/^\//, ''),
        status: containerInfo.State.Status,
        state: containerInfo.State,
        config: containerInfo.Config
      };
    } catch (error: any) {
      console.error(`[Server_DockerCompose] getContainerInfo failed for ${serviceName}: ${error.message}`);
      throw error;
    }
  }

  async getServiceLogs(serviceName: string, tail: number = 100): Promise<string> {
    const composePath = `${process.cwd()}/testeranto/docker-compose.yml`;
    const command = `docker compose -f "${composePath}" logs --tail ${tail} ${serviceName}`;

    try {
      const { stdout } = await execAsync(command);
      return stdout;
    } catch (error: any) {
      console.error(`[Server_DockerCompose] getServiceLogs failed for ${serviceName}: ${error.message}`);
      throw error;
    }
  }

  async isServiceRunning(serviceName: string): Promise<boolean> {
    try {
      const info = await this.getContainerInfo(serviceName);
      return info.status === 'running';
    } catch {
      return false;
    }
  }

  async restartService(serviceName: string): Promise<void> {
    const composePath = `${process.cwd()}/testeranto/docker-compose.yml`;
    const command = `docker compose -f "${composePath}" restart ${serviceName}`;

    console.log(`[Server_DockerCompose] restartService: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command);
      console.log(`[Server_DockerCompose] restartService: ${stdout}`);
      if (stderr) console.error(`[Server_DockerCompose] restartService stderr: ${stderr}`);
    } catch (error: any) {
      console.error(`[Server_DockerCompose] restartService failed for ${serviceName}: ${error.message}`);
      throw error;
    }
  }

  // Implement abstract methods from Server class
  protected async startDockerServices(): Promise<void> {
    this.logBusinessMessage("Starting Docker services (V2 business logic)...");

    // Setup API server (technological layer)
    await this.setupApi();

    // V2 Server_Docker.start() business logic:

    // 1. Setup Docker Compose
    await this.setupDockerCompose();

    // 2. Bring down any existing services
    this.logBusinessMessage("Bringing down existing Docker services...");
    await this.dockerComposeDown();

    // 3. Start all services
    this.logBusinessMessage("Starting all Docker services...");
    await this.dockerComposeUp();

    // 4. Add process nodes for Docker services
    await this.addProcessNodesForDockerServices();

    // 5. Wait for containers and add process nodes
    await this.waitForContainersAndAddProcessNodes();

    // 6. Start Docker events watcher
    // Store the cleanup function for later
    this.dockerEventsCleanup = await this.startDockerEventsWatcher();

    this.logBusinessMessage("Docker services started");
  }

  protected async stopDockerServices(): Promise<void> {
    this.logBusinessMessage("Stopping Docker services...");

    // Clean up API server
    await this.cleanupApi();

    // Clean up Docker events watcher
    if (this.dockerEventsCleanup) {
      this.dockerEventsCleanup();
      this.dockerEventsCleanup = null;
    }

    // Stop all Docker services
    await this.dockerComposeDown();

    this.logBusinessMessage("Docker services stopped");
  }

  protected async cleanupDockerProcesses(): Promise<void> {
    this.logBusinessMessage("Cleaning up Docker processes...");

    // Clean up any remaining Docker resources
    // This could include removing containers, networks, volumes
    // For now, just log
    this.logBusinessMessage("Docker processes cleaned up");
  }

  // Implement other abstract methods from Server class
  private async checkExistingTestResults(): Promise<void> {
    this.logBusinessMessage("Checking existing test results...");
    // Implementation would check for existing test results
  }

  private async initializeFileWatching(): Promise<void> {
    this.logBusinessMessage("Initializing file watching...");
    // Implementation would setup file watchers
  }

  private async startLoggingForAllServices(): Promise<void> {
    this.logBusinessMessage("Starting logging for all services...");
    // Implementation would start logging for all Docker services
  }

  private async stopAllFileWatchers(): Promise<void> {
    this.logBusinessMessage("Stopping all file watchers...");
    // Implementation would stop all file watchers
  }

  async startDockerEventsWatcher(callback?: (event: any) => void): Promise<() => void> {
    this.logBusinessMessage("Starting Docker events watcher...");

    // If no callback provided, use a default one that just logs
    const eventCallback = callback || ((event) => {
      this.logBusinessMessage(`Docker event: ${JSON.stringify(event)}`);
    });

    // Check if Docker is available first
    try {
      await execAsync('docker version', { timeout: 5000 });
    } catch {
      this.logBusinessMessage("Docker not available, skipping events watcher");
      // Return a no-op cleanup function
      return () => {
        this.logBusinessMessage("Docker events watcher not started");
      };
    }

    // Try to run docker events once to see if it works
    try {
      await execAsync('docker events --format "{{json .}}" --since 1s', { timeout: 2000 });
    } catch {
      // If it fails, don't start the watcher
      this.logBusinessMessage("Docker events command failed, skipping watcher");
      return () => {
        this.logBusinessMessage("Docker events watcher not started due to initial failure");
      };
    }

    const dockerEvents = spawn('docker', ['events', '--format', '{{json .}}']);

    let isRunning = true;

    dockerEvents.stdout.on('data', (data) => {
      if (!isRunning) return;

      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const event = JSON.parse(line);
            eventCallback(event);
          } catch {
            // Ignore parse errors - don't log them
          }
        }
      }
    });

    dockerEvents.stderr.on('data', (data) => {
      if (!isRunning) return;
      // Don't log stderr - just ignore it
    });

    dockerEvents.on('error', () => {
      if (!isRunning) return;
      // Don't log errors - just stop processing
      isRunning = false;
    });

    dockerEvents.on('close', () => {
      isRunning = false;
    });

    this.logBusinessMessage("Docker events watcher started (streaming mode)");

    return () => {
      if (isRunning) {
        isRunning = false;
        dockerEvents.kill();
        this.logBusinessMessage("Stopped Docker events watcher");
      }
    };
  }
}
