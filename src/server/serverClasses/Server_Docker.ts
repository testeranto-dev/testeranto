import type { IRunTime, ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import {
  getDockerComposeDownPure,
} from "./Server_Docker/Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  processExit,
  processCwd,
} from "./Server_Docker/Server_Docker_Dependents";
import { spawnPromise } from "./Server_Docker/utils";
import { waitForBundlesPure } from "./Server_Docker/utils/waitForBundlesPure";
import { Server_Docker_Compose } from "./Server_Docker_Compose";
import { embedConfigInHtml } from "./utils/embedConfigInHtml";
import { launchAllAgentsUtil } from "./utils/agentUtils";
import { updateTestStatusInGraph } from "./utils/updateTestStatusInGraph";
import { signalBuildersForOutputArtifactsUtil } from "./utils/dockerOutputUtils";
import { startGraphWatcherUtil } from "./utils/graphWatcherUtils";
import { startDockerServiceUtil, restartDockerServiceUtil } from "./utils/dockerCommandUtils";
import { launchBddTestDockerUtil, launchChecksDockerUtil, launchAiderDockerUtil, informAiderDockerUtil } from "./utils/dockerServiceMethodsUtils";
import { getBddServiceName, getAiderServiceName, getBaseServiceName } from "./utils/dockerServiceUtils";
import { handleBuilderServices } from "./utils/dockerStartBuilderUtils";
import { setupTestNodes } from "./utils/dockerTestSetupUtils";
import { stopBuilderServices } from "./utils/dockerStopBuilderUtils";
import { buildOutputImages } from "./utils/dockerBuildOutputUtils";
import { handleDockerStartUtil } from "./utils/dockerStartUtils";

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
      async (configs, mode, failedBuilderConfigs, graphManager, makeReportDirectory, getTestManager, updateTestStatusInGraph, updateEntrypointForServiceStart, consoleLog, consoleError) => {
        await setupTestNodes(
          configs,
          mode,
          failedBuilderConfigs,
          graphManager,
          makeReportDirectory,
          getTestManager,
          updateTestStatusInGraph,
          updateEntrypointForServiceStart,
          consoleLog,
          consoleError
        );
      },
      this.startGraphWatcher.bind(this),
      embedConfigInHtml,
      this.stop.bind(this),
      processExit
    );

    // Add test nodes to the graph for all configured tests using utility function
    await setupTestNodes(
      this.configs,
      this.mode,
      this.failedBuilderConfigs,
      this.graphManager,
      this.makeReportDirectory.bind(this),
      this.getTestManager.bind(this),
      updateTestStatusInGraph,
      this.updateEntrypointForServiceStart.bind(this),
      consoleLog,
      consoleError
    );

    // The actual test execution is handled by the Docker services that are already running
    // We just need to ensure the graph reflects the current state
    consoleLog('[Server_Docker] Test services are managed via Docker Compose and the graph');

    // Graph updates will be broadcast via /~/graph
  }

  private async launchAllAgents(): Promise<void> {
    await launchAllAgentsUtil(
      this.configs,
      this.graphManager,
      this.addProcessNodeToGraph.bind(this)
    );
  }

  private async createAgentNodesAndAiderProcesses(): Promise<void> {
    const { createAgentNodesAndAiderProcessesUtil } = await import('./utils/agentUtils');
    await createAgentNodesAndAiderProcessesUtil(
      this.configs,
      this.graphManager,
      this.addProcessNodeToGraph.bind(this)
    );
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
    await launchBddTestDockerUtil(
      this.graphManager,
      testName,
      configKey,
      this.getBddServiceName.bind(this),
      this.startDockerService.bind(this),
      consoleLog,
      consoleError
    );
  }

  protected async launchChecks(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    await launchChecksDockerUtil(
      this.graphManager,
      testName,
      configKey,
      this.getBaseServiceName.bind(this),
      this.startDockerService.bind(this),
      consoleLog,
      consoleError
    );
  }

  protected async launchAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    await launchAiderDockerUtil(
      this.graphManager,
      testName,
      configKey,
      this.getAiderServiceName.bind(this),
      this.startDockerService.bind(this),
      consoleLog,
      consoleError
    );
  }

  protected async informAider(
    runtime: IRunTime,
    testName: string,
    configKey: string,
    configValue: any,
    files?: any
  ): Promise<void> {
    await informAiderDockerUtil(
      this.graphManager,
      testName,
      configKey,
      this.getAiderServiceName.bind(this),
      this.restartDockerService.bind(this),
      consoleLog,
      consoleError,
      files
    );
  }

  private getBddServiceName(configKey: string, testName: string): string {
    return getBddServiceName(configKey, testName);
  }

  private getAiderServiceName(configKey: string, testName: string): string {
    return getAiderServiceName(configKey, testName);
  }

  private getBaseServiceName(configKey: string, testName: string): string {
    return getBaseServiceName(configKey, testName);
  }

  private async startDockerService(serviceName: string): Promise<void> {
    await startDockerServiceUtil(
      serviceName,
      this.spawnPromise.bind(this),
      consoleLog,
      consoleError
    );
  }

  private async restartDockerService(serviceName: string): Promise<void> {
    await restartDockerServiceUtil(
      serviceName,
      this.spawnPromise.bind(this),
      consoleLog,
      consoleError
    );
  }

  protected getTestManager(): any {
    return this;
  }

  public async stop(): Promise<void> {
    // Stop builder services using utility function
    await stopBuilderServices(
      this.configs,
      this.spawnPromise.bind(this),
      console.log,
      console.error
    );

    // Build output images using utility function
    await buildOutputImages(
      this.configs,
      this.spawnPromise.bind(this),
      console.log,
      console.error
    );

    // Clear any tracked processes
    this.logProcesses.clear();
    this.failedBuilderConfigs.clear();

    // Stop all remaining Docker services
    const result = await this.DC_down();

    // Wait for Docker services to fully stop
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.resourceChanged("/~/graph");
    await super.stop();
  }


  private async updateEntrypointForServiceStart(testName: string, configKey: string, serviceType: 'bdd' | 'checks' | 'aider'): Promise<void> {
    const { updateEntrypointForServiceStart } = await import('./utils/dockerServiceUtils');
    await updateEntrypointForServiceStart(this.graphManager, testName, configKey, serviceType);
  }

  private async updateAiderInGraph(testName: string, configKey: string, files?: any): Promise<void> {
    const { updateAiderInGraph } = await import('./utils/dockerServiceUtils');
    await updateAiderInGraph(this.graphManager, testName, configKey, files);
  }

  private startGraphWatcher(): void {

    const intervalId = startGraphWatcherUtil(
      this.graphManager,
      this.configs,
      this.launchBddTest.bind(this),
      this.launchChecks.bind(this),
      this.launchAider.bind(this),
      consoleLog,
      consoleError
    );
    // Store intervalId if needed for cleanup
    (this as any)._graphWatcherIntervalId = intervalId;
  }

  private async signalBuildersForOutputArtifacts(): Promise<void> {

    signalBuildersForOutputArtifactsUtil(this.configs, processCwd);
    // Wait a bit for builder to process
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
