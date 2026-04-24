import type { ITesterantoConfig } from "../../src/Types";
import type { IMode } from "../../src/server/types";
import { addProcessNodesForDockerServices } from "./Server_Docker/addProcessNodesForDockerServices";
import { createProcessNodesFromConfig } from "./Server_Docker/createProcessNodesFromConfig";
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
  consoleWarn,
  processCwd,
  processExit,
} from "./Server_Docker/Server_Docker_Dependents";
import { signalBuildersForOutputArtifacts } from "./Server_Docker/signalBuildersForOutputArtifacts";
import { startDockerService } from "./Server_Docker/startDockerService";
import { stopBuilderServicesAndWait } from "./Server_Docker/stopBuilderServicesAndWait";
import { stopServerDocker } from "./Server_Docker/stopServerDocker";
import { syncAllContainerStatuses } from "./Server_Docker/syncAllContainerStatuses";
import { updateAiderInGraph } from "./Server_Docker/updateAiderInGraph";
import { spawnPromise } from "./Server_Docker/utils";
import { ensureAllContainersHaveProcessNodesUtil } from "./Server_Docker/utils/ensureAllContainersHaveProcessNodesUtil";
import { findAndGenerateUpdateForContainerNamePure } from "./Server_Docker/utils/findAndGenerateUpdateForContainerNamePure";
import { forceStopAllContainersUtil } from "./Server_Docker/utils/forceStopAllContainersUtil";
import { startDockerEventsWatcherUtil } from "./Server_Docker/utils/startDockerEventsWatcherUtil";
import { stopAgentProcessesUtil } from "./Server_Docker/utils/stopAgentProcessesUtil";
import { stopAiderProcessesUtil } from "./Server_Docker/utils/stopAiderProcessesUtil";
import { updateProcessNodeWithContainerInfoPure } from "./Server_Docker/utils/updateProcessNodeWithContainerInfoPure";
import { waitForBundlesPure } from "./Server_Docker/utils/waitForBundlesPure";
import { waitForContainersAndAddProcessNodesUtil } from "./Server_Docker/utils/waitForContainersAndAddProcessNodesUtil";
import { Server_Docker_Compose } from "./Server_Docker_Compose";
import { parseContainerNameToProcessInfoUtil } from "./Server_Docker_utils/parseContainerNameToProcessInfoUtil";

export abstract class Server_Docker extends Server_Docker_Compose {
  protected failedBuilderConfigs: Set<string> = new Set();
  protected logProcesses: Map<string, { process: any; serviceName: string }> = new Map();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async start() {
    try {
      await super.start();

      this.dockerComposeManager.writeConfigForExtension(this.getProcessSummary());
      await this.dockerComposeManager.setupDockerCompose();

      await spawnPromise(getDockerComposeDownPure());

      const upResult = await this.DC_upAll();
      if (upResult.exitCode !== 0) {
        throw new Error(`Docker Compose services failed to start: ${upResult.err}`);
      }

      await this.addProcessNodesForDockerServices();
      await this.waitForContainersAndAddProcessNodes();

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

      this.startDockerEventsWatcher();
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
    dockerEventStatus: string
  ): Promise<void> {
    try {
      const update = updateProcessNodeWithContainerInfoPure(
        processId,
        containerId,
        serviceName,
        dockerEventStatus
      );
      this.applyUpdate(update);
      consoleLog(`[Server_Docker] Updated process node ${processId} with container ${containerId.substring(0, 12)}, Docker event: ${dockerEventStatus}, Graph status: ${update.operations[0].data.metadata.status}`);

      // Save the graph
      this.saveGraph();
    } catch (error: any) {
      consoleError(`[Server_Docker] Error updating process node ${processId}:`, error);
    }
  }


  private async addProcessNodesForDockerServices(): Promise<void> {
    const services = this.generateServices();
    await addProcessNodesForDockerServices(
      services,
      this.configs,
      consoleLog,
      this.getProcessNode.bind(this),
      this.applyUpdate.bind(this),
      this.saveGraph.bind(this),
      this.createProcessNodesFromConfig.bind(this)
    );
  }

  private async createProcessNodesFromConfig(): Promise<void> {
    await createProcessNodesFromConfig(
      this.configs,
      consoleLog,
      this.getProcessNode.bind(this),
      this.addProcessNodeToGraph.bind(this)
    );
  }


  protected makeReportDirectory(testName: string, configKey: string): string {
    return super.makeReportDirectory(testName, configKey);
  }

  protected async startDockerService(serviceName: string): Promise<void> {
    await startDockerService(
      serviceName,
      this.configs,
      this.spawnPromise.bind(this),
      consoleLog,
      consoleError,
      this.addProcessNodeToGraph.bind(this),
      this.updateContainerInfoFromDocker.bind(this),
      this.saveGraph.bind(this)
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

  public async stop(): Promise<void> {
    // Clear local state
    this.logProcesses.clear();
    this.failedBuilderConfigs.clear();

    // Stop the Docker events watcher
    if ((this as any)._dockerEventsProcess) {
      consoleLog("[Server_Docker] Stopping Docker events watcher...");
      (this as any)._dockerEventsProcess.kill();
    }

    // Stop the periodic container sync
    if ((this as any)._containerSyncInterval) {
      consoleLog("[Server_Docker] Stopping periodic container sync...");
      clearInterval((this as any)._containerSyncInterval);
    }

    await stopServerDocker(
      this.configs,
      this.mode,
      consoleLog,
      consoleError,
      consoleWarn,
      this.spawnPromise.bind(this),
      this.DC_down.bind(this),
      this.DC_ps.bind(this),
      this.stopAllFileWatchers.bind(this),
      this.stopAgentProcesses.bind(this),
      this.stopAiderProcesses.bind(this),
      this.stopBuilderServicesAndWait.bind(this),
      this.forceStopAllContainers.bind(this),
      this.resourceChanged.bind(this),
      super.stop.bind(this)
    );
  }


  private async updateEntrypointForServiceStart(testName: string, configKey: string, serviceType: 'bdd' | 'checks' | 'aider'): Promise<void> {
    const update = await updateEntrypointForServiceStartPure(testName, configKey, serviceType);
    this.applyUpdate(update);
  }

  private async updateAiderInGraph(testName: string, configKey: string, files?: any): Promise<void> {
    const update = updateAiderInGraph(testName, configKey, files);
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
    await stopAgentProcessesUtil(
      consoleLog,
      consoleError
    );
  }

  private async stopAiderProcesses(): Promise<void> {
    await stopAiderProcessesUtil(consoleLog, consoleError);
  }

  private async stopBuilderServicesAndWait(): Promise<void> {
    await stopBuilderServicesAndWait(
      this.configs,
      this.spawnPromise.bind(this),
      consoleLog,
      consoleError
    );
  }

  private async forceStopAllContainers(): Promise<void> {
    await forceStopAllContainersUtil(consoleLog, consoleError);
  }

  private async waitForContainersAndAddProcessNodes(): Promise<void> {
    await waitForContainersAndAddProcessNodesUtil(
      consoleLog,
      consoleError,
      this.parseContainerNameToProcessInfo.bind(this),
      this.getProcessNode.bind(this),
      this.applyUpdate.bind(this)
    );
  }

  private async ensureAllContainersHaveProcessNodes(): Promise<void> {
    await ensureAllContainersHaveProcessNodesUtil(
      consoleLog,
      consoleError,
      this.parseContainerNameToProcessInfo.bind(this),
      this.getProcessNode.bind(this),
      this.applyUpdate.bind(this)
    );
  }

  private parseContainerNameToProcessInfo(containerName: string): {
    processType: 'bdd' | 'check' | 'aider' | 'builder';
    configKey: string;
    testName: string;
  } | null {
    return parseContainerNameToProcessInfoUtil(containerName);
  }

  private async stopAllFileWatchers(): Promise<void> {
    try {
      // If we have stored unwatch functions, call them
      if ((this as any)._fileWatchers) {
        const watchers = (this as any)._fileWatchers;
        consoleLog(`[Server_Docker] Stopping ${watchers.length} file watchers`);
        for (const unwatch of watchers) {
          if (typeof unwatch === 'function') {
            try {
              unwatch();
            } catch (error) {
              consoleWarn(`[Server_Docker] Error stopping file watcher: ${error}`);
            }
          }
        }
        (this as any)._fileWatchers = [];
      }

      // Also, we need to unwatch all files using Node.js's unwatchFile
      // Since we don't have direct access to the watchers from watchFile,
      // we'll at least clear any pending timeouts
      if ((this as any)._watchTimeouts) {
        const timeouts = (this as any)._watchTimeouts;
        consoleLog(`[Server_Docker] Clearing ${timeouts.length} watch timeouts`);
        for (const timeout of timeouts) {
          if (timeout) {
            clearTimeout(timeout);
          }
        }
        (this as any)._watchTimeouts = [];
      }
    } catch (error: any) {
      consoleError(`[Server_Docker] Error stopping file watchers: ${error.message}`);
    }
  }

  private async signalBuildersForOutputArtifacts(): Promise<void> {
    await signalBuildersForOutputArtifacts(this.configs, processCwd);
  }

  private async startDockerEventsWatcher(): Promise<void> {
    const result = await startDockerEventsWatcherUtil(
      consoleLog,
      consoleError,
      this.parseContainerNameToProcessInfo.bind(this),
      this.updateProcessNodeWithContainerInfo.bind(this),
      this.updateProcessNodeByContainerName.bind(this),
      this.resourceChanged.bind(this),
      this.startPeriodicContainerSync.bind(this),
      this.syncAllContainerStatuses.bind(this)
    );
    // Store reference to clean up later
    (this as any)._dockerEventsProcess = result.process;
  }

  private startPeriodicContainerSync(): void {
    // Sync container status every 30 seconds to catch any missed events
    const syncInterval = setInterval(async () => {
      try {
        await this.syncAllContainerStatuses();
      } catch (error) {
        consoleError(`[PeriodicContainerSync] Error syncing container statuses:`, error);
      }
    }, 30000);

    // Store interval for cleanup
    (this as any)._containerSyncInterval = syncInterval;
  }

  private async syncAllContainerStatuses(): Promise<void> {
    await syncAllContainerStatuses(
      this.parseContainerNameToProcessInfo.bind(this),
      this.updateProcessNodeWithContainerInfo.bind(this),
      this.updateProcessNodeByContainerName.bind(this),
      this.getGraphData.bind(this),
      this.applyUpdate.bind(this),
      this.resourceChanged.bind(this),
      consoleLog,
      consoleError
    );
  }

  private async updateProcessNodeByContainerName(containerName: string, containerId: string, dockerEventStatus: string): Promise<void> {
    try {
      const graphData = this.getGraphData();
      const result = findAndGenerateUpdateForContainerNamePure(
        graphData,
        containerName,
        containerId,
        dockerEventStatus
      );

      if (result) {
        this.applyUpdate(result.update);
        consoleLog(`[Server_Docker] Updated process node ${result.nodeId} with container ${containerId.substring(0, 12)}, Docker event: ${dockerEventStatus}, Graph status: ${result.update.operations[0].data.metadata.status}`);
        this.saveGraph();
      } else {
        consoleLog(`[Server_Docker] No process node found for container: ${containerName}`);
      }
    } catch (error: any) {
      consoleError(`[Server_Docker] Error updating process node by container name ${containerName}:`, error);
    }
  }
}
