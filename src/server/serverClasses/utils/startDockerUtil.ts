import fs from 'fs';
import type { IRunTime, ITesterantoConfig } from "../../../Types";
import type { IMode } from "../../types";
import type { GraphManager } from "../../graph";
import type { AiderImageBuilder } from "../Server_Docker/AiderImageBuilder";
import type { DockerComposeManager } from "../Server_Docker/DockerComposeManager";
import { getDockerComposeDownPure } from "../Server_Docker/Server_Docker_Constants";
import { consoleError, consoleLog } from "../Server_Docker/Server_Docker_Dependents";
import { spawnPromise } from "../Server_Docker/utils";
import { waitForBundlesPure } from "../Server_Docker/utils/waitForBundlesPure";
import { embedConfigInHtml } from "./embedConfigInHtml";
import { launchAllAgentsUtil } from "./agentUtils";
import { updateTestStatusInGraph } from "./updateTestStatusInGraph";
import { startGraphWatcherUtil } from "./graphWatcherUtils";

export const startDockerUtil = async (
  configs: ITesterantoConfig,
  mode: IMode,
  graphManager: GraphManager,
  aiderImageBuilder: AiderImageBuilder,
  dockerComposeManager: DockerComposeManager,
  failedBuilderConfigs: Set<string>,
  logProcesses: Map<string, { process: any; serviceName: string }>,
  getTestManager: () => any,
  makeReportDirectory: (testName: string, configKey: string) => string,
  addProcessNodeToGraph: (
    processType: 'bdd' | 'check' | 'aider' | 'builder',
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    checkIndex?: number,
    status?: 'running' | 'stopped' | 'failed'
  ) => Promise<void>,
  updateEntrypointForServiceStart: (testName: string, configKey: string, serviceType: 'bdd' | 'checks' | 'aider') => Promise<void>,
  updateAiderInGraph: (testName: string, configKey: string, files?: any) => Promise<void>,
  startGraphWatcher: () => void,
  resourceChanged: (path: string) => void,
  stop: () => Promise<void>,
  processExit: (code: number) => never
): Promise<void> => {
  dockerComposeManager.writeConfigForExtension({});
  await dockerComposeManager.setupDockerCompose();

  await spawnPromise(getDockerComposeDownPure());

  // First, build the aider image for agent services
  try {
    consoleLog('[Server_Docker] Building aider image for agent services...');
    await aiderImageBuilder.buildAiderImage();
    consoleLog('[Server_Docker] ✅ Aider image built successfully');
  } catch (error: any) {
    consoleError('[Server_Docker] Failed to build aider image:', error as string);
    consoleLog('[Server_Docker] ⚠️ Agent services may not start without aider image');
  }

  // Start all Docker services EXCEPT agent services
  await dockerComposeManager.DC_upAll();

  consoleLog('[Server_Docker] Services can access the HTTP server at host.docker.internal:3000');
  consoleLog('[Server_Docker] Network configuration includes extra_hosts for host.docker.internal');
  consoleLog('[Server_Docker] Ensure the server is running on port 3000 and accessible from Docker containers');
  consoleLog('[Server_Docker] Note: Server must bind to 0.0.0.0 (not localhost) to accept connections from containers');

  // Launch all agents at startup
  await launchAllAgentsUtil(
    configs,
    graphManager,
    addProcessNodeToGraph
  );

  // Build builder services with error handling
  try {
    const failedConfigs = await dockerComposeManager.buildWithBuildKit();
    for (const configKey of failedConfigs) {
      failedBuilderConfigs.add(configKey);
      consoleLog(`[Server_Docker] Builder failed for config ${configKey}, will skip all dependent services`);
    }
  } catch (error) {
    consoleError('[Server_Docker] Builder image build failed:', error as string);
    for (const configKey of Object.keys(configs.runtimes)) {
      failedBuilderConfigs.add(configKey);
    }
  }

  // Start builder services with error handling
  try {
    const failedBuilderConfigsSet = await dockerComposeManager.startBuilderServices();
    for (const configKey of failedBuilderConfigsSet) {
      failedBuilderConfigs.add(configKey);
      consoleLog(`[Server_Docker] Builder failed for config ${configKey}, will skip all dependent services`);
    }

    // Add builder process nodes to graph for all configs with correct status
    for (const [configKey, configValue] of Object.entries(configs.runtimes)) {
      try {
        const isFailed = failedBuilderConfigs.has(configKey);
        await addProcessNodeToGraph(
          'builder',
          configValue.runtime as IRunTime,
          'builder',
          configKey,
          configValue,
          undefined,
          isFailed ? 'failed' : 'running'
        );
      } catch (error) {
        consoleError(`[Server_Docker] Error adding builder process node for ${configKey}:`, error as string);
      }
    }
  } catch (error) {
    consoleError('[Server_Docker] Failed to start builder services:', error as string);
    for (const configKey of Object.keys(configs.runtimes)) {
      failedBuilderConfigs.add(configKey);
    }
  }

  // Wait for bundles to be ready before proceeding with tests
  const bundleResult = await waitForBundlesPure({
    configs,
    failedBuilderConfigs,
    consoleLog,
    consoleWarn: consoleError,
    maxWaitTime: 30000,
    checkInterval: 500,
  });
  failedBuilderConfigs.clear();
  for (const configKey of bundleResult) {
    failedBuilderConfigs.add(configKey);
  }

  // Log the final status of builder services
  if (failedBuilderConfigs.size > 0) {
    consoleLog(`[Server_Docker] Builder services completed with ${failedBuilderConfigs.size} failed config(s): ${Array.from(failedBuilderConfigs).join(', ')}`);
  } else {
    consoleLog(`[Server_Docker] ✅ All builder services started successfully`);
  }

  // Add test nodes to the graph for all configured tests
  for (const [configKey, configValue] of Object.entries(configs.runtimes)) {
    // Skip configs with failed builders
    if (failedBuilderConfigs.has(configKey)) {
      consoleLog(`[Server_Docker] Skipping test nodes for config ${configKey} because builder failed`);
      continue;
    }

    const runtime: IRunTime = configValue.runtime as IRunTime;
    const tests = configValue.tests;

    for (const testName of tests) {
      try {
        const reportDir = makeReportDirectory(testName, configKey);

        if (!fs.existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
        }

        // Add test entrypoint node to graph
        const entrypointId = `entrypoint:${testName}`;
        const graphData = graphManager.getGraphData();
        const existingNode = graphData.nodes.find((n: any) => n.id === entrypointId);

        if (!existingNode) {
          // Create entrypoint node
          await graphManager.applyUpdate({
            operations: [{
              type: 'addNode',
              data: {
                id: entrypointId,
                type: 'entrypoint',
                label: testName.split('/').pop() || testName,
                description: `Test entrypoint: ${testName}`,
                status: 'todo',
                icon: 'file-text',
                metadata: {
                  configKey,
                  filePath: testName,
                  runtime,
                  timestamp: new Date().toISOString()
                }
              },
              timestamp: new Date().toISOString()
            }],
            timestamp: new Date().toISOString()
          });
        }

        // Update test status in graph to indicate it's ready
        await updateTestStatusInGraph(graphManager, testName, 'todo');

        // Mark test as needing initial services if builder succeeded
        if (mode === "dev" && !failedBuilderConfigs.has(configKey)) {
          consoleLog(`[Server_Docker] Marking test ${testName} for initial service start`);
          // Update the graph to indicate all services need to be started
          await updateEntrypointForServiceStart(testName, configKey, 'bdd');
          await updateEntrypointForServiceStart(testName, configKey, 'checks');
          await updateEntrypointForServiceStart(testName, configKey, 'aider');
        }

      } catch (error) {
        consoleError(`[Server_Docker] Error setting up test ${testName} for config ${configKey}:`, error as string);
      }
    }
  }

  // Start a service to watch the graph for entrypoints that need services started
  startGraphWatcher();

  if (mode === "once") {
    try {
      consoleLog("[Server_Docker] Tests completed, waiting for pending operations...");

      // Generate graph-data.json for dual-mode operation
      await embedConfigInHtml(configs);

      await new Promise((resolve) => setTimeout(resolve, 5000));
      await stop();
      processExit(0);
    } catch (error: any) {
      consoleError("[Server_Docker] Error in once mode:", error);
      try {
        await stop();
      } catch (stopError) {
        consoleError("[Server_Docker] Error stopping services:", stopError as string);
      }
      processExit(1);
    }
  }
};
