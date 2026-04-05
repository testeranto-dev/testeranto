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
} from "./Server_Docker/Server_Docker_Dependents";
import { spawnPromise } from "./Server_Docker/utils";
import { waitForBundlesPure } from "./Server_Docker/utils/waitForBundlesPure";
import { Server_Docker_Base } from "./Server_Docker_Base";
import { Server_Docker_Compose } from "./Server_Docker_Compose";

export abstract class Server_Docker extends Server_Docker_Compose {
  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async start() {
    await super.start();

    this.dockerComposeManager.writeConfigForExtension(this.getProcessSummary());
    await this.dockerComposeManager.setupDockerCompose();

    await spawnPromise(getDockerComposeDownPure());

    // Build builder services with error handling
    try {
      const failedConfigs = await this.dockerComposeManager.buildWithBuildKit();
      // Store which configs failed
      for (const configKey of failedConfigs) {
        (this as any).failedBuilderConfigs.add(configKey);
        consoleLog(`[Server_Docker] Builder failed for config ${configKey}, will skip all dependent services`);
      }
    } catch (error) {
      consoleError('[Server_Docker] Builder image build failed:', error as string);
      // Mark all configs as failed to be safe
      for (const configKey of Object.keys(this.configs.runtimes)) {
        (this as any).failedBuilderConfigs.add(configKey);
      }
    }

    // Start builder services with error handling
    try {
      const failedBuilderConfigs = await this.dockerComposeManager.startBuilderServices();
      // Store which configs failed
      for (const configKey of failedBuilderConfigs) {
        (this as any).failedBuilderConfigs.add(configKey);
        consoleLog(`[Server_Docker] Builder failed for config ${configKey}, will skip all dependent services`);
      }

      // Add builder process nodes for all configs
      for (const configKey of Object.keys(this.configs.runtimes)) {
        if (!failedBuilderConfigs.has(configKey)) {
          const configValue = this.configs.runtimes[configKey];
          await (this as any).addProcessNodeToGraph('builder', configValue.runtime as IRunTime, '', configKey, configValue);
        }
      }
    } catch (error) {
      consoleError('[Server_Docker] Failed to start builder services:', error as string);
      // Mark all configs as failed to be safe
      for (const configKey of Object.keys(this.configs.runtimes)) {
        (this as any).failedBuilderConfigs.add(configKey);
      }
    }

    // Wait for bundles to be ready before proceeding with tests
    (this as any).failedBuilderConfigs = await waitForBundlesPure({
      configs: this.configs,
      // processCwd: (this as any).processCwd,
      failedBuilderConfigs: (this as any).failedBuilderConfigs,
      consoleLog,
      consoleWarn: (this as any).consoleWarn,
      maxWaitTime: 30000,
      checkInterval: 500,
    });

    // Create an array of all test launch promises
    const testLaunchPromises: Promise<void>[] = [];

    for (const [configKey, configValue] of Object.entries(
      this.configs.runtimes,
    )) {
      // Skip configs with failed builders
      if ((this as any).failedBuilderConfigs.has(configKey)) {
        consoleLog(`[Server_Docker] Skipping test services for failed config ${configKey}`);
        continue;
      }

      const runtime: IRunTime = configValue.runtime as IRunTime;
      const tests = configValue.tests;

      for (const testName of tests) {
        testLaunchPromises.push((async () => {
          try {
            const reportDir = (this as any).makeReportDirectory(testName, configKey);

            if (!existsSync(reportDir)) {
              fs.mkdirSync(reportDir, { recursive: true });
            }

            if (this.mode === "dev") {
              await (this as any).testFileManager.watchInputFile(
                runtime,
                testName,
                (runtime, testName, configKey, configValue) =>
                  (this as any).launchBddTest(runtime, testName, configKey, configValue),
                (runtime, testName, configKey, configValue) =>
                  (this as any).launchChecks(runtime, testName, configKey, configValue),
                (runtime, testName, configKey, configValue, files) =>
                  (this as any).informAider(
                    runtime,
                    testName,
                    configKey,
                    configValue,
                    files,
                  ),
                (runtime, testName, configKey) =>
                  (this as any).testFileManager.loadInputFileOnce(
                    runtime,
                    testName,
                    configKey,
                  ),
                (runtime, testName, configKey, inputFiles) =>
                  (this as any).updateGraphWithInputFiles(runtime, testName, configKey, inputFiles),
              );
              await (this as any).testFileManager.watchOutputFile(
                runtime,
                testName,
                configKey,
              );
            } else {
              (this as any).testFileManager.loadInputFileOnce(runtime, testName, configKey);
            }

            await (this as any).createAiderMessageFile(
              runtime,
              testName,
              configKey,
              configValue,
            );
            await (this as any).launchBddTest(runtime, testName, configKey, configValue);
            await (this as any).launchChecks(runtime, testName, configKey, configValue);
            await (this as any).launchAider(runtime, testName, configKey, configValue);
          } catch (error) {
            consoleError(`[Server_Docker] Error processing test ${testName} for config ${configKey}:`, error as string);
            // Continue with other tests
          }
        })());
      }
    }

    // Launch all tests in parallel
    await Promise.allSettled(testLaunchPromises);

    if (this.mode === "once") {
      try {
        await (this as any).testCompletionWaiter.waitForAllTestsToComplete();
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

  public async stop(): Promise<void> {
    // Clear any tracked processes (though there shouldn't be any with the new approach)
    (this as any).logProcesses.clear();
    (this as any).failedBuilderConfigs.clear();

    // Stop Docker services
    const result = await this.DC_down();

    // Wait for Docker services to fully stop
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.resourceChanged("/~/processes");
    await super.stop();
  }
}
