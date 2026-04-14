import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { updateEntrypointForServiceStartPure } from "./Server_Docker/dockerServiceUtils";
import { handleBuilderServices } from "./Server_Docker/dockerStartBuilderUtils";
import { handleDockerStartUtil } from "./Server_Docker/dockerStartUtils";
import { setupTestNodes } from "./Server_Docker/dockerTestSetupUtils";
import { embedConfigInHtml } from "./Server_Docker/embedConfigInHtml";
import { launchAllAgentsUtil } from "./Server_Docker/launchAllAgentsUtil";
import { restartDockerServiceUtil } from "./Server_Docker/restartDockerServiceUtil";
import {
  getDockerComposeDownPure,
} from "./Server_Docker/Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  processCwd,
  processExit,
} from "./Server_Docker/Server_Docker_Dependents";
import { signalBuildersForOutputArtifactsUtil } from "./Server_Docker/signalBuildersForOutputArtifactsUtil";
import { startDockerServiceUtil } from "./Server_Docker/startDockerServiceUtil";
import { stopBuilderServices } from "./Server_Docker/stopBuilderServices";
import { spawnPromise } from "./Server_Docker/utils";
import { waitForBundlesPure } from "./Server_Docker/utils/waitForBundlesPure";
import { Server_Docker_Compose } from "./Server_Docker_Compose";
import { buildOutputImages } from "./Server_Docker/dockerBuildOutputUtils";
import { generateProcessNodesFromServicesPure } from "./Server_Docker/generateProcessNodesFromServicesPure";
import { parseServiceInfoPure } from "./Server_Docker/parseServiceInfoPure";
import { exec } from "child_process";
import { promisify } from "util";

export abstract class Server_Docker extends Server_Docker_Compose {
  protected failedBuilderConfigs: Set<string> = new Set();
  protected logProcesses: Map<string, { process: any; serviceName: string }> = new Map();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async start() {
    try {
      consoleLog("[Server_Docker] Starting...");
      await super.start();
      consoleLog("[Server_Docker] super.start() completed");

      consoleLog("[Server_Docker] Writing config for extension...");
      this.dockerComposeManager.writeConfigForExtension(this.getProcessSummary());
      consoleLog("[Server_Docker] Setting up Docker Compose...");
      await this.dockerComposeManager.setupDockerCompose();

      // First, ensure any existing services are down
      consoleLog("[Server_Docker] Stopping any existing Docker Compose services...");
      await spawnPromise(getDockerComposeDownPure());
      consoleLog("[Server_Docker] Existing services stopped");

      // Start Docker Compose services first
      consoleLog("[Server_Docker] Starting Docker Compose services...");
      const upResult = await this.DC_upAll();
      if (upResult.exitCode !== 0) {
        consoleError(`[Server_Docker] Failed to start Docker Compose services: ${upResult.err}`);
        throw new Error(`Docker Compose services failed to start: ${upResult.err}`);
      }
      consoleLog("[Server_Docker] Docker Compose services started successfully");

      // Immediately add process nodes for all Docker Compose services
      consoleLog("[Server_Docker] Adding process nodes for Docker Compose services...");
      await this.addProcessNodesForDockerServices();
      
      // Wait for containers to be fully started and add any missing process nodes
      consoleLog("[Server_Docker] Waiting for containers to be fully started and adding process nodes...");
      await this.waitForContainersAndAddProcessNodes();

      // Start all services and update graph atomically
      consoleLog("[Server_Docker] Starting all services and updating graph...");
      await handleDockerStartUtil(
        this.configs,
        this.mode,
        this.dockerComposeManager,
        this.aiderImageBuilder,
        this.failedBuilderConfigs,
        this.addProcessNodeToGraph.bind(this),
        consoleLog,
        consoleError,
        this.launchAllAgents.bind(this),
        handleBuilderServices,
        waitForBundlesPure,
        async (configs, mode, failedBuilderConfigs, makeReportDirectory, getTestManager, updateTestStatusInGraph, updateEntrypointForServiceStart, consoleLog, consoleError) => {
          const updates = await setupTestNodes(
            configs,
            mode,
            failedBuilderConfigs,
            makeReportDirectory,
            getTestManager,
            updateTestStatusInGraph,
            updateEntrypointForServiceStart,
            consoleLog,
            consoleError
          );
          return updates;
        },
        this.startGraphWatcher.bind(this),
        embedConfigInHtml,
        this.stop.bind(this),
        processExit
      );

      // Note: setupTestNodes is already called inside handleDockerStartUtil
      // and the updates are applied there, so we don't need to call it again here
      // This prevents duplicate graph updates

      // Start monitoring agent containers
      this.startAgentContainerWatcher();

      consoleLog("[Server_Docker] Start completed successfully");
      // Ensure graph is saved
      // this.graphManager.saveGraph();
    } catch (error: any) {
      consoleError("[Server_Docker] Error during start:", error);
      throw error;
    }
  }

  private async launchAllAgents(): Promise<void> {
    await launchAllAgentsUtil(
      this.configs,
      this.addProcessNodeToGraph.bind(this),
      this.updateProcessNodeWithContainerInfo.bind(this)
    );
  }

  private async updateProcessNodeWithContainerInfo(
    processId: string, 
    containerId: string, 
    serviceName: string, 
    status: string
  ): Promise<void> {
    try {
      const updateTimestamp = new Date().toISOString();
      const update = {
        operations: [{
          type: 'updateNode' as const,
          data: {
            id: processId,
            metadata: {
              containerId: containerId,
              serviceName: serviceName,
              containerStatus: status,
              updatedAt: updateTimestamp,
              status: status === 'running' ? 'running' : 'stopped'
            }
          },
          timestamp: updateTimestamp
        }],
        timestamp: updateTimestamp
      };
      this.applyUpdate(update);
      consoleLog(`[Server_Docker] Updated process node ${processId} with container ${containerId.substring(0, 12)}`);
      
      // Save the graph
      this.saveGraph();
    } catch (error: any) {
      consoleError(`[Server_Docker] Error updating process node ${processId}:`, error);
    }
  }


  private async addProcessNodesForDockerServices(): Promise<void> {
    // Get the list of services from Docker Compose
    const services = this.generateServices();
    consoleLog(`[Server_Docker] Found ${Object.keys(services).length} Docker services to add as process nodes`);

    // Use pure function to generate operations
    const { operations, processInfos } = generateProcessNodesFromServicesPure(services, this.configs);

    // Apply operations to the graph
    for (const operation of operations) {
      // Check if process node already exists
      const processId = operation.data.id;
      if (this.getProcessNode(processId)) {
        consoleLog(`[Server_Docker] Process node already exists: ${processId}`);
        continue;
      }

      // Apply the operation
      this.applyUpdate({
        operations: [operation],
        timestamp: operation.timestamp
      });
    }

    // Also create process nodes for all tests from configuration
    // This ensures we have process nodes even before Docker starts
    await this.createProcessNodesFromConfig();
    
    // Save the graph after adding all process nodes
    this.saveGraph();
    consoleLog("[Server_Docker] Graph saved with Docker service process nodes");
  }

  private async createProcessNodesFromConfig(): Promise<void> {
    consoleLog(`[Server_Docker] Creating process nodes from configuration...`);
    
    // For each runtime configuration
    for (const [configKey, runtimeConfig] of Object.entries(this.configs.runtimes)) {
      const tests = runtimeConfig.tests || [];
      const runtime = runtimeConfig.runtime;
      
      consoleLog(`[Server_Docker] Processing config ${configKey} with ${tests.length} tests`);
      
      // Create process nodes for each test
      for (const testName of tests) {
        if (typeof testName !== 'string') continue;
        
        // Create BDD process node
        const bddProcessId = `bdd_process:${configKey}:${testName}`;
        if (!this.getProcessNode(bddProcessId)) {
          await this.addProcessNodeToGraph(
            'bdd',
            runtime as any,
            testName,
            configKey,
            runtimeConfig,
            undefined,
            'todo' // Set initial status to 'todo' since Docker hasn't started yet
          );
        }
        
        // Create check process node
        const checkProcessId = `check_process:${configKey}:${testName}`;
        if (!this.getProcessNode(checkProcessId)) {
          await this.addProcessNodeToGraph(
            'check',
            runtime as any,
            testName,
            configKey,
            runtimeConfig,
            undefined,
            'todo'
          );
        }
        
        // Create aider process node
        const aiderProcessId = `aider_process:${configKey}:${testName}`;
        if (!this.getProcessNode(aiderProcessId)) {
          await this.addProcessNodeToGraph(
            'aider',
            runtime as any,
            testName,
            configKey,
            runtimeConfig,
            undefined,
            'todo'
          );
        }
      }
      
      // Create builder process node for this config
      const builderProcessId = `builder_process:${configKey}:builder`;
      if (!this.getProcessNode(builderProcessId)) {
        await this.addProcessNodeToGraph(
          'builder',
          runtime as any,
          'builder',
          configKey,
          runtimeConfig,
          undefined,
          'todo'
        );
      }
    }
    
    consoleLog(`[Server_Docker] Created process nodes from configuration`);
  }


  protected makeReportDirectory(testName: string, configKey: string): string {
    return super.makeReportDirectory(testName, configKey);
  }

  protected async startDockerService(serviceName: string): Promise<void> {
    await startDockerServiceUtil(
      serviceName,
      this.spawnPromise.bind(this),
      consoleLog,
      consoleError
    );

    // Parse service info using pure function
    const { processType, runtime, testName, configKey } = parseServiceInfoPure(serviceName, this.configs);

    // Only add process node for known service types
    if (processType !== 'docker_process' && configKey !== 'unknown') {
      const runtimeConfig = this.configs.runtimes[configKey];
      if (runtimeConfig) {
        await this.addProcessNodeToGraph(
          processType,
          runtime as any,
          testName,
          configKey,
          runtimeConfig
        );
        
        // Update container info from Docker (update from below)
        // This will query Docker and update the graph
        await this.updateContainerInfoFromDocker(serviceName);
        
        // Ensure graph is saved
        this.saveGraph();
      }
    }
  }

  private async restartDockerService(serviceName: string): Promise<void> {
    await restartDockerServiceUtil(
      serviceName,
      this.spawnPromise.bind(this),
      consoleLog,
      consoleError
    );
  }

  public async stop(): Promise<void> {
    consoleLog("[Server_Docker] Stopping Docker services...");
    
    // First, stop all agent processes
    try {
      consoleLog("[Server_Docker] Stopping agent processes...");
      await this.stopAgentProcesses();
    } catch (error: any) {
      consoleError(`[Server_Docker] Error stopping agent processes: ${error.message}`);
    }
    
    // Then, explicitly stop all aider processes
    try {
      consoleLog("[Server_Docker] Stopping aider processes...");
      await this.stopAiderProcesses();
    } catch (error: any) {
      consoleError(`[Server_Docker] Error stopping aider processes: ${error.message}`);
    }
    
    // Stop builder services and wait for them to complete
    try {
      consoleLog("[Server_Docker] Stopping builder services...");
      await this.stopBuilderServicesAndWait();
    } catch (error: any) {
      consoleError(`[Server_Docker] Error stopping builder services: ${error.message}`);
    }
    
    // Then, stop all Docker Compose services and wait for them to be fully stopped
    try {
      consoleLog("[Server_Docker] Stopping Docker Compose services...");
      const downResult = await this.DC_down();
      if (downResult.exitCode !== 0) {
        consoleError(`[Server_Docker] Docker Compose down had issues: ${downResult.err}`);
      } else {
        consoleLog("[Server_Docker] Docker Compose services stopped");
      }
      
      // Check if any containers are still running
      const psResult = await this.DC_ps();
      if (psResult.exitCode === 0 && psResult.out && psResult.out.trim() !== '') {
        consoleLog("[Server_Docker] Some containers may still be running, forcing stop...");
        // Force stop any remaining containers
        await this.forceStopAllContainers();
      } else {
        consoleLog("[Server_Docker] All containers are stopped");
      }
    } catch (error: any) {
      consoleError(`[Server_Docker] Error stopping Docker Compose: ${error.message}`);
    }

    // Build output images
    try {
      consoleLog("[Server_Docker] Building output images...");
      await buildOutputImages(
        this.configs,
        this.spawnPromise.bind(this),
        console.log,
        console.error
      );
    } catch (error: any) {
      consoleError(`[Server_Docker] Error building output images: ${error.message}`);
    }

    // Clear local state
    this.logProcesses.clear();
    this.failedBuilderConfigs.clear();

    // Notify about graph changes
    this.resourceChanged("/~/graph");
    
    // Stop the Docker events watcher
    if ((this as any)._dockerEventsProcess) {
      consoleLog("[Server_Docker] Stopping Docker events watcher...");
      (this as any)._dockerEventsProcess.kill();
    }
    
    // Call parent stop
    consoleLog("[Server_Docker] Calling parent stop...");
    await super.stop();
  }


  private async updateEntrypointForServiceStart(testName: string, configKey: string, serviceType: 'bdd' | 'checks' | 'aider'): Promise<void> {
    const update = await updateEntrypointForServiceStartPure(testName, configKey, serviceType);
    this.applyUpdate(update);
  }

  private async updateAiderInGraph(testName: string, configKey: string, files?: any): Promise<void> {
    // Since updateAiderInGraph is not pure, we need to create a pure version
    // For now, we'll implement a basic version
    const timestamp = new Date().toISOString();
    const aiderProcessId = `aider_process:${configKey}:${testName}`;

    const update = {
      operations: [{
        type: 'updateNode' as const,
        data: {
          id: aiderProcessId,
          metadata: {
            filesUpdated: timestamp,
            files: files
          }
        },
        timestamp
      }],
      timestamp
    };

    this.applyUpdate(update);
  }

  // DEPRECATED
  private startGraphWatcher(): void {

    // const intervalId = startGraphWatcherUtil(
    //   this.graphManager,
    //   this.configs,
    //   this.launchBddTest.bind(this),
    //   this.launchChecks.bind(this),
    //   this.launchAider.bind(this),
    //   consoleLog,
    //   consoleError
    // );
    // // Store intervalId if needed for cleanup
    // (this as any)._graphWatcherIntervalId = intervalId;
  }

  private async stopAgentProcesses(): Promise<void> {
    try {
      const execAsync = promisify(exec);
      
      // Get all container IDs with names starting with 'agent-'
      const { stdout } = await execAsync('docker ps --format "{{.ID}} {{.Names}}"');
      const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');
      
      const agentContainers = lines.filter(line => {
        const parts = line.split(' ');
        if (parts.length >= 2) {
          const containerName = parts[1];
          return containerName.startsWith('agent-');
        }
        return false;
      }).map(line => line.split(' ')[0]);
      
      if (agentContainers.length === 0) {
        consoleLog("[Server_Docker] No agent containers found");
        return;
      }
      
      consoleLog(`[Server_Docker] Found ${agentContainers.length} agent containers to stop`);
      
      // Stop each agent container
      for (const containerId of agentContainers) {
        try {
          consoleLog(`[Server_Docker] Stopping agent container: ${containerId}`);
          await execAsync(`docker stop ${containerId}`);
          consoleLog(`[Server_Docker] Stopped agent container: ${containerId}`);
        } catch (error: any) {
          consoleError(`[Server_Docker] Error stopping agent container ${containerId}: ${error.message}`);
        }
      }
      
      // Wait for them to stop
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove stopped agent containers
      for (const containerId of agentContainers) {
        try {
          await execAsync(`docker rm -f ${containerId}`);
          consoleLog(`[Server_Docker] Removed agent container: ${containerId}`);
        } catch (error: any) {
          // Container might already be removed, ignore
        }
      }
      
    } catch (error: any) {
      consoleError(`[Server_Docker] Error in stopAgentProcesses: ${error.message}`);
    }
  }

  private async stopAiderProcesses(): Promise<void> {
    try {
      const execAsync = promisify(exec);
      
      // Get all container IDs with names containing 'aider'
      const { stdout } = await execAsync('docker ps --format "{{.ID}} {{.Names}}"');
      const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');
      
      const aiderContainers = lines.filter(line => {
        const parts = line.split(' ');
        if (parts.length >= 2) {
          const containerName = parts[1];
          return containerName.includes('aider');
        }
        return false;
      }).map(line => line.split(' ')[0]);
      
      if (aiderContainers.length === 0) {
        consoleLog("[Server_Docker] No aider containers found");
        return;
      }
      
      consoleLog(`[Server_Docker] Found ${aiderContainers.length} aider containers to stop`);
      
      // Stop each aider container
      for (const containerId of aiderContainers) {
        try {
          consoleLog(`[Server_Docker] Stopping aider container: ${containerId}`);
          await execAsync(`docker stop ${containerId}`);
          consoleLog(`[Server_Docker] Stopped aider container: ${containerId}`);
        } catch (error: any) {
          consoleError(`[Server_Docker] Error stopping aider container ${containerId}: ${error.message}`);
        }
      }
      
      // Wait for them to stop
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove stopped aider containers
      for (const containerId of aiderContainers) {
        try {
          await execAsync(`docker rm -f ${containerId}`);
          consoleLog(`[Server_Docker] Removed aider container: ${containerId}`);
        } catch (error: any) {
          // Container might already be removed, ignore
        }
      }
      
    } catch (error: any) {
      consoleError(`[Server_Docker] Error in stopAiderProcesses: ${error.message}`);
    }
  }

  private async stopBuilderServicesAndWait(): Promise<void> {
    try {
      consoleLog("[Server_Docker] Signaling builder services to produce output artifacts...");
      
      // First, send SIGTERM to all builder containers to trigger artifact production
      const execAsync = promisify(exec);
      
      // Get all builder container IDs
      const { stdout } = await execAsync('docker ps --filter "name=builder" --format "{{.ID}}"');
      const builderContainerIds = stdout.trim().split('\n').filter(id => id.trim() !== '');
      
      if (builderContainerIds.length === 0) {
        consoleLog("[Server_Docker] No builder containers found");
      } else {
        consoleLog(`[Server_Docker] Found ${builderContainerIds.length} builder containers to signal`);
        
        // Send SIGTERM to each builder container
        for (const containerId of builderContainerIds) {
          try {
            consoleLog(`[Server_Docker] Sending SIGTERM to builder container: ${containerId}`);
            await execAsync(`docker kill --signal=SIGTERM ${containerId}`);
            consoleLog(`[Server_Docker] Sent SIGTERM to builder container: ${containerId}`);
          } catch (error: any) {
            consoleError(`[Server_Docker] Error sending SIGTERM to builder container ${containerId}: ${error.message}`);
          }
        }
        
        // Wait for builders to process SIGTERM and produce artifacts
        consoleLog("[Server_Docker] Waiting for builders to produce output artifacts...");
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Now stop the builder services
      consoleLog("[Server_Docker] Stopping builder services...");
      await stopBuilderServices(
        this.configs,
        this.spawnPromise.bind(this),
        console.log,
        console.error
      );
      
      // Wait for builder containers to stop
      consoleLog("[Server_Docker] Waiting for builder containers to stop...");
      
      // Check for builder containers and wait for them to exit
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        const { stdout: psStdout } = await execAsync('docker ps --format "{{.Names}}"');
        const containerNames = psStdout.trim().split('\n').filter(name => name.trim() !== '');
        
        const builderContainers = containerNames.filter(name => name.includes('builder'));
        
        if (builderContainers.length === 0) {
          consoleLog("[Server_Docker] All builder containers have stopped");
          break;
        }
        
        consoleLog(`[Server_Docker] Still waiting for ${builderContainers.length} builder containers: ${builderContainers.join(', ')}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        consoleLog("[Server_Docker] Some builder containers may still be running after waiting");
      }
      
    } catch (error: any) {
      consoleError(`[Server_Docker] Error in stopBuilderServicesAndWait: ${error.message}`);
    }
  }

  private async forceStopAllContainers(): Promise<void> {
    try {
      const execAsync = promisify(exec);
      
      // Get all container IDs
      const { stdout } = await execAsync('docker ps -q');
      const containerIds = stdout.trim().split('\n').filter(id => id.trim() !== '');
      
      if (containerIds.length === 0) {
        consoleLog("[Server_Docker] No containers running");
        return;
      }
      
      consoleLog(`[Server_Docker] Force stopping ${containerIds.length} containers...`);
      
      // Stop each container
      for (const containerId of containerIds) {
        try {
          await execAsync(`docker stop ${containerId}`);
          consoleLog(`[Server_Docker] Stopped container: ${containerId}`);
        } catch (error: any) {
          consoleError(`[Server_Docker] Error stopping container ${containerId}: ${error.message}`);
        }
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove any stopped containers
      const { stdout: stoppedStdout } = await execAsync('docker ps -a -q');
      const allContainerIds = stoppedStdout.trim().split('\n').filter(id => id.trim() !== '');
      
      for (const containerId of allContainerIds) {
        try {
          await execAsync(`docker rm -f ${containerId}`);
          consoleLog(`[Server_Docker] Removed container: ${containerId}`);
        } catch (error: any) {
          // Container might already be removed, ignore
        }
      }
      
    } catch (error: any) {
      consoleError(`[Server_Docker] Error in forceStopAllContainers: ${error.message}`);
    }
  }

  private async waitForContainersAndAddProcessNodes(): Promise<void> {
    // We no longer wait for containers to create process nodes
    // Process nodes are created from configuration in addProcessNodesForDockerServices
    // This method can be used to update existing process nodes with container information
    consoleLog(`[Server_Docker] Process nodes already created from configuration, skipping container wait`);
    
    // Optionally, we can still try to get container info for existing process nodes
    // but we shouldn't create new process nodes here
    try {
      const execAsync = promisify(exec);
      const { stdout } = await execAsync('docker ps --format "{{.Names}} {{.ID}}"');
      const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        const [containerName, containerId] = line.split(' ');
        const processInfo = this.parseContainerNameToProcessInfo(containerName);
        if (processInfo) {
          const { processType, configKey, testName } = processInfo;
          const processId = `${processType}_process:${configKey}:${testName}`;
          
          // Update existing process node with container info
          const processNode = this.getProcessNode(processId);
          if (processNode) {
            const updateTimestamp = new Date().toISOString();
            const update = {
              operations: [{
                type: 'updateNode' as const,
                data: {
                  id: processId,
                  metadata: {
                    ...processNode.metadata,
                    containerId: containerId,
                    containerName: containerName,
                    updatedAt: updateTimestamp,
                    status: 'running'
                  }
                },
                timestamp: updateTimestamp
              }],
              timestamp: updateTimestamp
            };
            this.applyUpdate(update);
            consoleLog(`[Server_Docker] Updated process node ${processId} with container ${containerId}`);
          }
        }
      }
    } catch (error: any) {
      consoleError(`[Server_Docker] Error getting container info: ${error.message}`);
      // Don't throw - this is non-critical
    }
  }

  private async ensureAllContainersHaveProcessNodes(): Promise<void> {
    // Process nodes are now created from configuration, not from running containers
    // This method can update container info for existing process nodes
    try {
      const execAsync = promisify(exec);
      const { stdout } = await execAsync('docker ps --format "{{.Names}} {{.ID}}"');
      const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');
      
      consoleLog(`[Server_Docker] Found ${lines.length} running containers`);
      
      for (const line of lines) {
        const [containerName, containerId] = line.split(' ');
        const processInfo = this.parseContainerNameToProcessInfo(containerName);
        if (processInfo) {
          const { processType, configKey, testName } = processInfo;
          const processId = `${processType}_process:${configKey}:${testName}`;
          
          // Update existing process node with container info
          const processNode = this.getProcessNode(processId);
          if (processNode) {
            const updateTimestamp = new Date().toISOString();
            const update = {
              operations: [{
                type: 'updateNode' as const,
                data: {
                  id: processId,
                  metadata: {
                    ...processNode.metadata,
                    containerId: containerId,
                    containerName: containerName,
                    updatedAt: updateTimestamp,
                    status: 'running'
                  }
                },
                timestamp: updateTimestamp
              }],
              timestamp: updateTimestamp
            };
            this.applyUpdate(update);
            consoleLog(`[Server_Docker] Updated process node ${processId} with container info`);
          } else {
            consoleLog(`[Server_Docker] No process node found for container: ${containerName}`);
          }
        }
      }
    } catch (error: any) {
      consoleError(`[Server_Docker] Error updating container info: ${error.message}`);
    }
  }

  private parseContainerNameToProcessInfo(containerName: string): {
    processType: 'bdd' | 'check' | 'aider' | 'builder';
    configKey: string;
    testName: string;
  } | null {
    // Parse container names based on our naming convention
    // Format: {configKey}-{sanitizedTestPath}-{processType} or {configKey}-builder
    
    // Handle builder containers
    if (containerName.endsWith('-builder')) {
      const configKey = containerName.replace('-builder', '');
      return {
        processType: 'builder',
        configKey,
        testName: 'builder'
      };
    }
    
    // Handle agent containers (these are separate from test processes)
    if (containerName.startsWith('agent-')) {
      // Agents are handled separately, not as test processes
      return null;
    }
    
    // Match test process containers
    // Pattern: {configKey}-{sanitizedTestPath}-{processType}
    // Where sanitizedTestPath has underscores instead of slashes, and dots replaced with hyphens
    
    // Try to match each process type
    const processTypes = ['bdd', 'aider'] as const;
    for (const processType of processTypes) {
      if (containerName.endsWith(`-${processType}`)) {
        const prefix = containerName.slice(0, -(processType.length + 1)); // Remove -{processType}
        const firstDashIndex = prefix.indexOf('-');
        if (firstDashIndex === -1) {
          return null;
        }
        
        const configKey = prefix.substring(0, firstDashIndex);
        const testPart = prefix.substring(firstDashIndex + 1);
        
        // Convert sanitized test path back to original
        // Replace underscores with slashes, and hyphens with dots where appropriate
        let testName = testPart.replace(/_/g, '/');
        // Handle common patterns
        testName = testName.replace(/-test-ts$/g, '.test.ts');
        testName = testName.replace(/-spec-ts$/g, '.spec.ts');
        testName = testName.replace(/-test-js$/g, '.test.js');
        testName = testName.replace(/-spec-js$/g, '.spec.js');
        
        return {
          processType,
          configKey,
          testName
        };
      }
    }
    
    // Handle check containers (they have index numbers)
    const checkMatch = containerName.match(/^(.*)-check-(\d+)$/);
    if (checkMatch) {
      const prefix = checkMatch[1];
      const firstDashIndex = prefix.indexOf('-');
      if (firstDashIndex === -1) {
        return null;
      }
      
      const configKey = prefix.substring(0, firstDashIndex);
      const testPart = prefix.substring(firstDashIndex + 1);
      
      // Convert sanitized test path back to original
      let testName = testPart.replace(/_/g, '/');
      testName = testName.replace(/-test-ts$/g, '.test.ts');
      testName = testName.replace(/-spec-ts$/g, '.spec.ts');
      testName = testName.replace(/-test-js$/g, '.test.js');
      testName = testName.replace(/-spec-js$/g, '.spec.js');
      
      return {
        processType: 'check',
        configKey,
        testName
      };
    }
    
    return null;
  }

  private async signalBuildersForOutputArtifacts(): Promise<void> {

    signalBuildersForOutputArtifactsUtil(this.configs, processCwd);
    // Wait a bit for builder to process
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async startAgentContainerWatcher(): Promise<void> {
    // Don't use polling - use Docker events instead
    // This is more efficient and doesn't require constant polling
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      // Start a background process to watch for Docker events
      // We'll use spawn to run docker events in the background
      const { spawn } = await import('child_process');
      
      const dockerEvents = spawn('docker', ['events', '--filter', 'type=container', '--format', '{{json .}}']);
      
      dockerEvents.stdout.on('data', async (data) => {
        try {
          const eventStr = data.toString().trim();
          if (!eventStr) return;
          
          const event = JSON.parse(eventStr);
          const containerId = event.id;
          const status = event.status;
          const containerName = event.Actor?.Attributes?.name;
          
          if (containerName && containerName.startsWith('agent-')) {
            const agentName = containerName.replace('agent-', '');
            const processId = `aider_process:agent:${agentName}`;
            
            consoleLog(`[AgentWatcher] Container ${containerName} ${status}`);
            
            // Update the graph with the new status
            await this.updateProcessNodeWithContainerInfo(
              processId,
              containerId,
              containerName,
              status
            );
          }
        } catch (error) {
          consoleError(`[AgentWatcher] Error processing Docker event:`, error);
        }
      });
      
      dockerEvents.stderr.on('data', (data) => {
        consoleError(`[AgentWatcher] Docker events error: ${data}`);
      });
      
      dockerEvents.on('close', (code) => {
        consoleLog(`[AgentWatcher] Docker events process exited with code ${code}`);
      });
      
      // Store reference to clean up later
      (this as any)._dockerEventsProcess = dockerEvents;
      
    } catch (error: any) {
      consoleError(`[Server_Docker] Error starting agent container watcher:`, error);
    }
  }
}
