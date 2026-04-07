import fs, { existsSync } from "fs";
import type { IRunTime, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import {
  getDockerComposeDownPure,
  logMessage,
} from "./Server_Docker/Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  processExit,
  execSyncWrapper,
  processCwd,
} from "./Server_Docker/Server_Docker_Dependents";
import { spawnPromise } from "./Server_Docker/utils";
import { waitForBundlesPure } from "./Server_Docker/utils/waitForBundlesPure";
import { Server_Docker_Compose } from "./Server_Docker_Compose";
import type { Server_TestManager } from "./Server_TestManager";

export abstract class Server_Docker extends Server_Docker_Compose {
  protected failedBuilderConfigs: Set<string> = new Set();
  protected logProcesses: Map<string, { process: any; serviceName: string }> = new Map();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async start() {
    await super.start();

    this.dockerComposeManager.writeConfigForExtension(this.getProcessSummary());
    await this.dockerComposeManager.setupDockerCompose();

    await spawnPromise(getDockerComposeDownPure());

    // First, build the aider image for agent services
    try {
      consoleLog('[Server_Docker] Building aider image for agent services...');
      await this.aiderImageBuilder.buildAiderImage();
      consoleLog('[Server_Docker] ✅ Aider image built successfully');
    } catch (error: any) {
      consoleError('[Server_Docker] Failed to build aider image:', error as string);
      consoleLog('[Server_Docker] ⚠️ Agent services may not start without aider image');
      // Continue anyway - we'll try to start agents anyway
    }

    // Start all Docker services including agent services
    await this.DC_upAll();

    // Launch all agents on startup
    await this.launchAllAgents();

    // Build builder services with error handling
    try {
      const failedConfigs = await this.dockerComposeManager.buildWithBuildKit();
      // Store which configs failed
      for (const configKey of failedConfigs) {
        this.failedBuilderConfigs.add(configKey);
        consoleLog(`[Server_Docker] Builder failed for config ${configKey}, will skip all dependent services`);
      }
    } catch (error) {
      consoleError('[Server_Docker] Builder image build failed:', error as string);
      // Mark all configs as failed to be safe
      for (const configKey of Object.keys(this.configs.runtimes)) {
        this.failedBuilderConfigs.add(configKey);
      }
    }

    // Start builder services with error handling
    try {
      const failedBuilderConfigs = await this.dockerComposeManager.startBuilderServices();
      // Store which configs failed
      for (const configKey of failedBuilderConfigs) {
        this.failedBuilderConfigs.add(configKey);
        consoleLog(`[Server_Docker] Builder failed for config ${configKey}, will skip all dependent services`);
      }

      // Add builder process nodes to graph for all configs
      for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
        try {
          await this.testManager.addProcessNodeToGraph(
            'builder',
            configValue.runtime as IRunTime,
            'builder',
            configKey,
            configValue,
            undefined,
            this.graphManager?.getGraphManager ? this.graphManager.getGraphManager() : null
          );
        } catch (error) {
          consoleError(`[Server_Docker] Error adding builder process node for ${configKey}:`, error as string);
        }
      }
    } catch (error) {
      consoleError('[Server_Docker] Failed to start builder services:', error as string);
      // Mark all configs as failed to be safe
      for (const configKey of Object.keys(this.configs.runtimes)) {
        this.failedBuilderConfigs.add(configKey);
      }
    }

    // Wait for bundles to be ready before proceeding with tests
    const bundleResult = await waitForBundlesPure({
      configs: this.configs,
      failedBuilderConfigs: this.failedBuilderConfigs,
      consoleLog,
      consoleWarn: consoleError,
      maxWaitTime: 30000,
      checkInterval: 500,
    });
    this.failedBuilderConfigs = bundleResult;

    // Log the final status of builder services
    if (this.failedBuilderConfigs.size > 0) {
      consoleLog(`[Server_Docker] Builder services completed with ${this.failedBuilderConfigs.size} failed config(s): ${Array.from(this.failedBuilderConfigs).join(', ')}`);
    } else {
      consoleLog(`[Server_Docker] ✅ All builder services started successfully`);
    }

    // Create an array of all test launch promises
    const testLaunchPromises: Promise<void>[] = [];

    for (const [configKey, configValue] of Object.entries(
      this.configs.runtimes,
    )) {
      // Skip configs with failed builders
      if (this.failedBuilderConfigs.has(configKey)) {
        consoleLog(`[Server_Docker] Skipping test services for config ${configKey} because builder failed`);
        continue;
      }

      const runtime: IRunTime = configValue.runtime as IRunTime;
      const tests = configValue.tests;

      for (const testName of tests) {
        testLaunchPromises.push((async () => {
          try {
            const reportDir = this.makeReportDirectory(testName, configKey);

            if (!existsSync(reportDir)) {
              fs.mkdirSync(reportDir, { recursive: true });
            }

            if (this.mode === "dev") {
              const testFileManager = this.getTestManager().getTestFileManager();
              await testFileManager.watchInputFile(
                runtime,
                testName,
                (runtime, testName, configKey, configValue) =>
                  this.launchBddTest(runtime, testName, configKey, configValue),
                (runtime, testName, configKey, configValue) =>
                  this.launchChecks(runtime, testName, configKey, configValue),
                (runtime, testName, configKey, configValue, files) =>
                  this.informAider(
                    runtime,
                    testName,
                    configKey,
                    configValue,
                    files,
                  ),
                (runtime, testName, configKey) =>
                  testFileManager.loadInputFileOnce(
                    runtime,
                    testName,
                    configKey,
                  ),
                (runtime, testName, configKey, inputFiles) => {
                  this.getTestManager().updateGraphWithInputFiles(
                    runtime, testName, configKey, inputFiles,
                    (this as any).graphManager?.getGraphManager ? (this as any).graphManager.getGraphManager() : null
                  );
                  // Graph updates will be broadcast via /~/graph when the graph is actually updated
                },
              );
              await testFileManager.watchOutputFile(
                runtime,
                testName,
                configKey,
              );
            } else {
              const testFileManager = this.getTestManager().getTestFileManager();
              testFileManager.loadInputFileOnce(runtime, testName, configKey);
            }

            await this.launchBddTest(runtime, testName, configKey, configValue);
            await this.launchChecks(runtime, testName, configKey, configValue);
            await this.launchAider(runtime, testName, configKey, configValue);
          } catch (error) {
            consoleError(`[Server_Docker] Error processing test ${testName} for config ${configKey}:`, error as string);
            // Continue with other tests
          }
        })());
      }
    }

    // Launch all tests in parallel
    await Promise.allSettled(testLaunchPromises);

    // Graph updates will be broadcast via /~/graph

    if (this.mode === "once") {
      try {
        logMessage(
          "[Server_Docker] Tests completed, waiting for pending operations...",
        );

        // Generate graph-data.json for dual-mode operation
        const { embedConfigInHtml } = await import("./utils/embedConfigInHtml");
        await embedConfigInHtml(this.configs);

        await new Promise((resolve) => setTimeout(resolve, 5000));
        await this.stop();
        processExit(0);
      } catch (error: any) {
        consoleError("[Server_Docker] Error in once mode:", error);
        try {
          await this.stop();
        } catch (stopError) {
          consoleError("[Server_Docker] Error stopping services:", stopError as string);
        }
        processExit(1);
      }
    }
  }

  private async launchAllAgents(): Promise<void> {
    const agents = this.configs.agents;
    if (!agents || Object.keys(agents).length === 0) {
      consoleLog('[Server_Docker] No agents configured');
      return;
    }

    consoleLog(`[Server_Docker] Launching ${Object.keys(agents).length} agents via docker-compose...`);

    // Note: aider image should already be built in start() method
    // If it failed there, we'll try to continue anyway

    // Agents are already defined in docker-compose.yml via generateServicesPure
    // We just need to start them using docker-compose
    // First, get all agent service names
    const agentServiceNames = Object.keys(agents).map(agentName => `agent-${agentName}`);
    
    if (agentServiceNames.length > 0) {
      try {
        // Start all agent services using docker-compose
        const servicesToStart = agentServiceNames.join(' ');
        consoleLog(`[Server_Docker] Starting agent services: ${servicesToStart}`);
        
        // Use a more robust command that ensures the container stays running
        await spawnPromise(
          `docker compose -f "testeranto/docker-compose.yml" up -d --wait ${servicesToStart}`,
        );
        
        consoleLog(`[Server_Docker] ✅ All agent services started via docker-compose`);
        
        // Wait a moment for services to fully start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if agent services are actually running
        for (const serviceName of agentServiceNames) {
          try {
            const checkCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${serviceName}`;
            const containerId = execSyncWrapper(checkCmd, { cwd: processCwd() }).trim();
            if (containerId) {
              const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
              const status = execSyncWrapper(statusCmd, { cwd: processCwd() }).trim();
              consoleLog(`[Server_Docker] Agent service ${serviceName}: ${status} (container: ${containerId.substring(0, 12)})`);
            } else {
              consoleError(`[Server_Docker] Agent service ${serviceName} not found after start attempt`);
            }
          } catch (checkError: any) {
            consoleError(`[Server_Docker] Error checking agent service ${serviceName}:`, checkError as string);
          }
        }
        
        // Add agent nodes to graph and create aider processes for them
        await this.createAgentNodesAndAiderProcesses();
        
      } catch (error: any) {
        consoleError(`[Server_Docker] Failed to start agent services via docker-compose:`, error as string);
        // Try to start services individually
        consoleLog('[Server_Docker] Trying to start agent services individually...');
        for (const serviceName of agentServiceNames) {
          try {
            await spawnPromise(
              `docker compose -f "testeranto/docker-compose.yml" up -d ${serviceName}`,
            );
            consoleLog(`[Server_Docker] Started agent service: ${serviceName}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (individualError: any) {
            consoleError(`[Server_Docker] Failed to start agent service ${serviceName}:`, individualError as string);
          }
        }
      }
    }
  }

  private async createAgentNodesAndAiderProcesses(): Promise<void> {
    const agents = this.configs.agents;
    if (!agents || Object.keys(agents).length === 0) {
      return;
    }

    const graphManager = this.graphManager?.getGraphManager ? this.graphManager.getGraphManager() : null;
    if (!graphManager) {
      consoleError('[Server_Docker] Graph manager not available for creating agent nodes');
      return;
    }

    for (const [agentName, agentConfig] of Object.entries(agents)) {
      try {
        const timestamp = new Date().toISOString();
        const containerName = `agent-${agentName}`;
        const agentNodeId = `agent:${agentName}`;
        
        // First, create agent node
        const agentUpdate = {
          operations: [
            {
              type: 'addNode' as const,
              data: {
                id: agentNodeId,
                type: 'agent',
                label: `Agent: ${agentName}`,
                description: `Agent ${agentName} with aider`,
                status: 'running',
                icon: 'agent',
                metadata: {
                  agentName,
                  containerName,
                  markdownFile: agentConfig.markdownFile,
                  hasAider: true,
                  timestamp
                }
              },
              timestamp
            }
          ],
          timestamp
        };
        
        graphManager.applyUpdate(agentUpdate);
        
        // Get container info to create aider process
        const containerInfo = await this.getContainerInfo(containerName);
        const containerId = containerInfo?.Id;
        
        // Create aider process node for the agent
        const aiderProcessId = `aider_process:agent:${agentName}`;
        const aiderUpdate = {
          operations: [
            {
              type: 'addNode' as const,
              data: {
                id: aiderProcessId,
                type: 'aider_process',
                label: `Aider Process: Agent ${agentName}`,
                description: `Aider process for agent ${agentName}`,
                status: 'running',
                icon: 'aider',
                metadata: {
                  agentName,
                  containerName,
                  containerId,
                  isAgentAider: true,
                  timestamp
                }
              },
              timestamp
            },
            {
              type: 'addEdge' as const,
              data: {
                source: agentNodeId,
                target: aiderProcessId,
                attributes: {
                  type: 'hasAiderProcess',
                  timestamp
                }
              },
              timestamp
            }
          ],
          timestamp
        };
        
        graphManager.applyUpdate(aiderUpdate);
        
        consoleLog(`[Server_Docker] Created agent and aider process nodes for ${agentName}`);
        
      } catch (error: any) {
        consoleError(`[Server_Docker] Error creating nodes for agent ${agentName}:`, error as string);
      }
    }
  }

  protected makeReportDirectory(testName: string, configKey: string): string {
    return super.makeReportDirectory(testName, configKey);
  }

  protected async launchBddTest(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    await super.launchBddTest(runtime, testName, configKey, configValue);
  }

  protected async launchChecks(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    await super.launchChecks(runtime, testName, configKey, configValue);
  }

  protected async launchAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    await super.launchAider(runtime, testName, configKey, configValue);
  }

  protected async informAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    files?: any
  ): Promise<void> {
    await super.informAider(runtime, testName, configKey, configValue, files);
  }

  protected getTestManager(): Server_TestManager {
    return super.getTestManager();
  }

  public async stop(): Promise<void> {
    // Clear any tracked processes
    this.logProcesses.clear();
    this.failedBuilderConfigs.clear();

    // Stop Docker services
    const result = await this.DC_down();

    // Wait for Docker services to fully stop
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In unified approach, broadcast graph updates instead
    // TODO This should be defined in API 
    this.resourceChanged("/~/graph");
    await super.stop();
  }
}
