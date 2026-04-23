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
import { addProcessNodeToGraphV3Pure } from "../utils/graph/addProcessNodeToGraphV3Pure";

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

  // Override startDockerProcess to actually start the Docker service for the test
  protected async startDockerProcess(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    const serviceName = this.generateServiceName(configKey, testName, 'bdd');
    this.logBusinessMessage(`startDockerProcess: starting service ${serviceName} for test ${testName}`);
    await this.dockerComposeUp([serviceName]);
  }

  // Graph operations are now handled by the inherited graph methods

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
  protected generateServiceName(configKey: string, testName: string, type: string): string {
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

  // Graph updates are now handled exclusively by the Docker events watcher
  // Process nodes are added/updated/removed based on container events,
  // not by creating nodes at launch time.

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

    // 3. Start Docker events watcher BEFORE bringing services up
    // This ensures we capture start/create events for all containers
    this.logBusinessMessage("Starting Docker events watcher before bringing services up...");
    this.dockerEventsCleanup = await this.startDockerEventsWatcher();

    // 4. Start all services (events watcher will capture their start events)
    this.logBusinessMessage("Starting all Docker services...");
    await this.dockerComposeUp();

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

    const eventCallback = callback || ((event) => {
      this.handleDockerEvent(event);
    });

    // Check if Docker is available first
    try {
      await execAsync('docker version', { timeout: 5000 });
      this.logBusinessMessage("Docker version check succeeded");
    } catch {
      this.logBusinessMessage("Docker not available, skipping events watcher");
      return () => {};
    }

    const dockerEvents = spawn('docker', ['events', '--format', '{{json .}}']);

    let isRunning = true;

    dockerEvents.stdout.on('data', (data) => {
      if (!isRunning) return;

      const raw = data.toString();
      this.logBusinessMessage(`[DockerEventsWatcher] raw data received: ${raw.substring(0, 200)}`);

      const lines = raw.trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const event = JSON.parse(line);
            this.logBusinessMessage(`[DockerEventsWatcher] parsed event: type=${event.Type}, action=${event.Action || event.status}, id=${(event.id || event.Actor?.ID || '?').substring(0, 12)}`);
            eventCallback(event);
          } catch (parseError: any) {
            this.logBusinessMessage(`[DockerEventsWatcher] failed to parse line: ${line.substring(0, 100)} error=${parseError.message}`);
          }
        }
      }
    });

    dockerEvents.stderr.on('data', (data) => {
      const stderr = data.toString();
      if (stderr.trim()) {
        this.logBusinessMessage(`[DockerEventsWatcher] stderr: ${stderr.substring(0, 200)}`);
      }
    });

    dockerEvents.on('error', (err) => {
      this.logBusinessMessage(`[DockerEventsWatcher] spawn error: ${err.message}`);
      isRunning = false;
    });

    dockerEvents.on('close', (code) => {
      this.logBusinessMessage(`[DockerEventsWatcher] process closed with code ${code}`);
      isRunning = false;
    });

    this.logBusinessMessage("Docker events watcher started");

    return () => {
      if (isRunning) {
        isRunning = false;
        dockerEvents.kill();
        this.logBusinessMessage("Stopped Docker events watcher");
      }
    };
  }

  // Graph operations are handled by the inherited methods from Server_Graph
  // applyUpdate and saveGraph are available through the inheritance chain

  // Handle a Docker event and update the graph accordingly
  private handleDockerEvent(event: any): void {
    this.logBusinessMessage(`[handleDockerEvent] received event: Type=${event.Type}, Action=${event.Action || event.status}, id=${(event.id || event.Actor?.ID || '?').substring(0, 12)}`);

    // Only process container events
    if (event.Type !== 'container') {
      this.logBusinessMessage(`[handleDockerEvent] skipping non-container event (Type=${event.Type})`);
      return;
    }

    const containerId = event.id || event.Actor?.ID;
    if (!containerId) {
      this.logBusinessMessage(`[handleDockerEvent] no containerId found in event`);
      return;
    }

    const action = event.Action || event.status;
    const serviceName = event.Actor?.Attributes?.['com.docker.compose.service'] || containerId;

    this.logBusinessMessage(`[handleDockerEvent] processing: action=${action}, containerId=${containerId.substring(0, 12)}, serviceName=${serviceName}`);

    // Determine the process type from the service name
    let processType: 'bdd' | 'check' | 'aider' | 'builder' | 'agent' | 'unknown' = 'unknown';
    if (serviceName.includes('-bdd')) processType = 'bdd';
    else if (serviceName.includes('-check-')) processType = 'check';
    else if (serviceName.includes('-aider')) processType = 'aider';
    else if (serviceName.startsWith('agent-')) processType = 'agent';
    else if (serviceName.includes('-builder')) processType = 'builder';

    this.logBusinessMessage(`[handleDockerEvent] determined processType=${processType}`);

    // Extract configKey and testName from service name
    let configKey = '';
    let testName = '';
    if (processType === 'agent') {
      configKey = 'agent';
      testName = serviceName.replace('agent-', '');
    } else if (processType !== 'unknown') {
      const parts = serviceName.split('-');
      configKey = parts[0];
      testName = serviceName.substring(configKey.length + 1);
    }

    this.logBusinessMessage(`[handleDockerEvent] configKey=${configKey}, testName=${testName}`);

    const nodeId = `docker-${containerId}`;

    switch (action) {
      case 'start':
      case 'create':
        {
          this.logBusinessMessage(`[handleDockerEvent] creating process node for ${serviceName}`);
          const operations = addProcessNodeToGraphV3Pure(
            containerId,
            serviceName,
            processType,
            configKey,
            testName,
            'running',
          );
          this.logBusinessMessage(`[handleDockerEvent] generated ${operations.length} operations`);
          const timestamp = new Date().toISOString();
          const update = { operations, timestamp };
          this.logBusinessMessage(`[handleDockerEvent] calling applyUpdate`);
          this.applyUpdate(update);
          this.logBusinessMessage(`[handleDockerEvent] applyUpdate completed`);
          console.log(`[DockerEvent] ${action} ${serviceName} (${containerId}) -> added process node`);
          this.broadcastProcessStatusChanged(nodeId, 'running', {
            containerId,
            serviceName,
            processType,
            configKey,
            testName,
          });
          this.broadcastContainerStatusChanged(containerId, 'running', serviceName);
          this.broadcastGraphUpdated();
          this.logBusinessMessage(`[handleDockerEvent] calling saveGraph`);
          this.saveGraph();
          this.logBusinessMessage(`[handleDockerEvent] saveGraph completed`);
        }
        break;

      case 'die':
      case 'stop':
      case 'kill':
        {
          this.logBusinessMessage(`[handleDockerEvent] updating process node for ${serviceName} to stopped`);
          const operations = addProcessNodeToGraphV3Pure(
            containerId,
            serviceName,
            processType,
            configKey,
            testName,
            'stopped',
          );
          const updateOps = operations.map((op) => {
            if (op.type === 'addNode') {
              return {
                type: 'updateNode' as const,
                data: {
                  id: op.data.id,
                  status: 'done',
                  metadata: {
                    ...op.data.metadata,
                    status: 'stopped',
                    isActive: false,
                  },
                },
                timestamp: op.timestamp,
              };
            }
            return op;
          });
          this.logBusinessMessage(`[handleDockerEvent] generated ${updateOps.length} update operations`);
          const timestamp = new Date().toISOString();
          const update = { operations: updateOps, timestamp };
          this.logBusinessMessage(`[handleDockerEvent] calling applyUpdate`);
          this.applyUpdate(update);
          this.logBusinessMessage(`[handleDockerEvent] applyUpdate completed`);
          console.log(`[DockerEvent] ${action} ${serviceName} (${containerId}) -> updated process node to stopped`);
          this.broadcastProcessStatusChanged(nodeId, 'stopped', {
            containerId,
            serviceName,
            processType,
          });
          this.broadcastContainerStatusChanged(containerId, 'stopped', serviceName);
          this.broadcastGraphUpdated();
          this.logBusinessMessage(`[handleDockerEvent] calling saveGraph`);
          this.saveGraph();
          this.logBusinessMessage(`[handleDockerEvent] saveGraph completed`);
        }
        break;

      case 'destroy':
        {
          this.logBusinessMessage(`[handleDockerEvent] removing process node for ${serviceName}`);
          const timestamp = new Date().toISOString();
          const update = {
            operations: [
              { type: 'removeNode', data: { id: nodeId }, timestamp },
            ],
            timestamp,
          };
          this.logBusinessMessage(`[handleDockerEvent] calling applyUpdate`);
          this.applyUpdate(update);
          this.logBusinessMessage(`[handleDockerEvent] applyUpdate completed`);
          console.log(`[DockerEvent] ${action} ${serviceName} (${containerId}) -> removed process node`);
          this.broadcastProcessStatusChanged(nodeId, 'destroyed', {
            containerId,
            serviceName,
          });
          this.broadcastContainerStatusChanged(containerId, 'destroyed', serviceName);
          this.broadcastGraphUpdated();
          this.logBusinessMessage(`[handleDockerEvent] calling saveGraph`);
          this.saveGraph();
          this.logBusinessMessage(`[handleDockerEvent] saveGraph completed`);
        }
        break;

      default:
        this.logBusinessMessage(`[handleDockerEvent] unhandled action ${action} for ${serviceName} (${containerId}) -> no graph modification`);
        console.log(`[DockerEvent] ${action} ${serviceName} (${containerId}) -> no graph modification`);
    }
  }
}
