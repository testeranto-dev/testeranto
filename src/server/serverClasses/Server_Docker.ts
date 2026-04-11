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

    // Start all Docker services EXCEPT agent services
    // Agents will be started on-demand via the API
    await this.DC_upAll();

    // Log information about accessing the HTTP server from services
    consoleLog('[Server_Docker] Services can access the HTTP server at host.docker.internal:3000');
    consoleLog('[Server_Docker] Network configuration includes extra_hosts for host.docker.internal');
    consoleLog('[Server_Docker] Ensure the server is running on port 3000 and accessible from Docker containers');
    consoleLog('[Server_Docker] Note: Server must bind to 0.0.0.0 (not localhost) to accept connections from containers');

    // Launch all agents at startup
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

      // Add builder process nodes to graph for all configs with correct status
      for (const [configKey, configValue] of Object.entries(this.configs.runtimes)) {
        try {
          const isFailed = this.failedBuilderConfigs.has(configKey);
          await this.testManager.addProcessNodeToGraph(
            'builder',
            configValue.runtime as IRunTime,
            'builder',
            configKey,
            configValue,
            undefined,
            this.graphManager?.getGraphManager ? this.graphManager.getGraphManager() : null,
            isFailed ? 'failed' : 'running'
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
                // TODO in
                (runtime, testName, configKey, configSlice: IConfigSlice) => {
                  this.getTestManager().updateGraphWithInputFiles(
                    runtime, testName, configKey, configSlice,
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

    consoleLog(`[Server_Docker] Launching ${Object.keys(agents).length} agents at startup...`);

    // Agents are defined in docker-compose.yml via generateServicesPure
    // They will be started automatically with docker-compose up
    // We just need to wait for them to be ready

    // Wait a moment for services to fully start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if agent services are running and update graph with actual status
    const agentServiceNames = Object.keys(agents).map(agentName => `agent-${agentName}`);
    for (const serviceName of agentServiceNames) {
      try {
        const checkCmd = `docker compose -f "testeranto/docker-compose.yml" ps -q ${serviceName}`;
        const containerId = execSyncWrapper(checkCmd, { cwd: processCwd() }).trim();
        if (containerId) {
          const statusCmd = `docker inspect --format='{{.State.Status}}' ${containerId}`;
          const status = execSyncWrapper(statusCmd, { cwd: processCwd() }).trim();
          consoleLog(`[Server_Docker] Agent service ${serviceName}: ${status} (container: ${containerId.substring(0, 12)})`);
          
          // Update the graph with actual container status
          // Extract agent name from service name (agent-{agentName})
          const agentName = serviceName.replace('agent-', '');
          const aiderProcessId = `aider_process:agent:${agentName}`;
          const graphManager = this.graphManager?.getGraphManager ? this.graphManager.getGraphManager() : null;
          
          if (graphManager && typeof graphManager.applyUpdate === 'function') {
            const graphData = graphManager.getGraphData();
            const nodeExists = graphData.nodes.some((node: any) => node.id === aiderProcessId);
            
            if (nodeExists) {
              const timestamp = new Date().toISOString();
              const update = {
                operations: [{
                  type: 'updateNode',
                  data: {
                    id: aiderProcessId,
                    metadata: {
                      runtime: 'node',
                      testName: agentName,
                      configKey: 'agent',
                      processType: 'aider',
                      timestamp: timestamp,
                      actualStatus: status,
                      containerName: serviceName,
                      containerId: containerId
                    }
                  },
                  timestamp: timestamp
                }],
                timestamp: timestamp
              };
              graphManager.applyUpdate(update);
              if (typeof graphManager.saveGraph === 'function') {
                graphManager.saveGraph();
              }
              consoleLog(`[Server_Docker] Updated graph for ${aiderProcessId} with status: ${status}`);
            }
          }
        } else {
          consoleError(`[Server_Docker] Agent service ${serviceName} not found`);
        }
      } catch (checkError: any) {
        consoleError(`[Server_Docker] Error checking agent service ${serviceName}:`, checkError as string);
      }
    }

    // Add agent nodes to graph
    await this.createAgentNodesAndAiderProcesses();
  }

  private async createAgentNodesAndAiderProcesses(): Promise<void> {
    const agents = this.configs.agents || {};

    for (const [agentName, agentConfig] of Object.entries(agents)) {
      const containerName = `agent-${agentName}`;
      const agentNodeId = `agent:${agentName}`;
      const aiderProcessId = `aider_process:agent:${agentName}`;

      // Create agent node in graph
      await this.addProcessNodeToGraph(
        'aider',
        'node' as IRunTime, // Agents use node runtime
        agentName,
        'agent',
        agentConfig,
        undefined,
        this.graphManager?.getGraphManager ? this.graphManager.getGraphManager() : null,
        'running'
      );

      // Update the aider process node to include container information
      const graphManager = this.graphManager?.getGraphManager ? this.graphManager.getGraphManager() : null;
      if (graphManager && typeof graphManager.applyUpdate === 'function') {
        // First, check if the node exists in the graph
        const graphData = graphManager.getGraphData();
        const nodeExists = graphData.nodes.some((node: any) => node.id === aiderProcessId);
        
        if (nodeExists) {
          const timestamp = new Date().toISOString();
          const update = {
            operations: [{
              type: 'updateNode',
              data: {
                id: aiderProcessId,
                metadata: {
                  runtime: 'node',
                  testName: agentName,
                  configKey: 'agent',
                  processType: 'aider',
                  timestamp: timestamp,
                  actualStatus: 'running',
                  containerName: containerName,
                  containerId: containerName
                }
              },
              timestamp: timestamp
            }],
            timestamp: timestamp
          };
          graphManager.applyUpdate(update);
          // Save the graph to persist the changes
          if (typeof graphManager.saveGraph === 'function') {
            graphManager.saveGraph();
          }
          consoleLog(`[Server_Docker] Updated aider process node ${aiderProcessId} with container info: ${containerName}`);
        } else {
          consoleLog(`[Server_Docker] Aider process node ${aiderProcessId} not found in graph, cannot update with container info`);
        }
      }

      consoleLog(`[Server_Docker] Created agent nodes for ${agentName}`);
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
    // First, stop builder services with SIGTERM so they can produce output artifacts
    // We'll send SIGTERM to builder containers directly
    for (const [configKey, config] of Object.entries(this.configs.runtimes)) {
      const outputs = config.outputs;
      if (!outputs || outputs.length === 0) continue;

      const builderServiceName = `${configKey}-builder`;
      console.log(`[Server_Docker] Stopping builder ${builderServiceName} to produce output artifacts`);

      try {
        // Send SIGTERM to builder container
        await this.spawnPromise(`docker compose -f "testeranto/docker-compose.yml" kill -s SIGTERM ${builderServiceName}`);
        // Wait for builder to exit and produce artifacts
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`[Server_Docker] Error stopping builder ${builderServiceName}:`, error);
      }
    }

    // Now build docker images for output artifacts
    for (const [configKey, config] of Object.entries(this.configs.runtimes)) {
      const outputs = config.outputs;
      if (!outputs || outputs.length === 0) continue;

      console.log(`[Server_Docker] Building docker images for ${configKey} outputs`);

      for (const entrypoint of outputs) {
        try {
          const dockerfile = config.dockerfile;
          const projectRoot = process.cwd()

          // Create image name
          const cleanEntrypoint = entrypoint
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          const imageName = `output-${configKey}-${cleanEntrypoint}:latest`;

          console.log(`[Server_Docker] Building ${imageName} from ${dockerfile}`);

          const buildCommand = `docker build -t ${imageName} -f ${dockerfile} ${projectRoot}`;
          await this.spawnPromise(buildCommand);

          console.log(`[Server_Docker] ✅ Built ${imageName}`);
        } catch (error) {
          console.error(`[Server_Docker] Failed to build docker image for ${entrypoint}:`, error);
          // Continue with other outputs
        }
      }
    }

    // Clear any tracked processes
    this.logProcesses.clear();
    this.failedBuilderConfigs.clear();

    // Stop all remaining Docker services
    const result = await this.DC_down();

    // Wait for Docker services to fully stop
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In unified approach, broadcast graph updates instead
    // TODO This should be defined in API 
    this.resourceChanged("/~/graph");
    await super.stop();
  }

  private async signalBuildersForOutputArtifacts(): Promise<void> {
    // For each runtime config with outputs, signal its builder
    for (const [configKey, config] of Object.entries(this.configs.runtimes)) {
      const outputs = config.outputs;
      if (!outputs || outputs.length === 0) continue;

      console.log(`[Server_Docker] Signaling builder for ${configKey} to produce output artifacts`);

      // Find the builder service name
      const builderServiceName = `${configKey}-builder`;

      // Send signal to builder container
      // We can create a trigger file that the builder watches for
      const triggerPath = `${this.processCwd()}/testeranto/build-output-trigger-${configKey}`;
      const fs = await import('fs');
      fs.writeFileSync(triggerPath, JSON.stringify({ outputs }));

      console.log(`[Server_Docker] Created trigger file at ${triggerPath}`);

      // Wait a bit for builder to process
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
