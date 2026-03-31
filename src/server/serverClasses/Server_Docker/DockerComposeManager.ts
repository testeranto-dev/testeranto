import type { ITesterantoConfig } from "../../../Types";
import type { IMode } from "../../types";
import { executeDockerComposeCommand, spawnPromise } from "./utils";
import { BuilderServicesManager } from "./BuilderServicesManager";
import { AiderImageBuilder } from "./AiderImageBuilder";
import { buildWithBuildKitPure } from "./utils/buildWithBuildKitPure";
import { generateServicesPure } from "./utils/generateServicesPure";
import { getDockerComposeCommandsPure } from "./utils/getDockerComposeCommandsPure";
import { writeComposeFile } from "./utils/writeComposeFile";
import { writeConfigForExtensionOnStop } from "./utils/writeConfigForExtensionOnStop";
import { writeConfigForExtensionPure } from "./utils/writeConfigForExtensionPure";
import { processCwd } from "./Server_Docker_Dependents";

export interface IDockerComposeResult {
  exitCode: number;
  out: string;
  err: string;
  data: any;
}

export class DockerComposeManager {
  private builderServicesManager: BuilderServicesManager;
  private aiderImageBuilder: AiderImageBuilder;

  constructor(
    private configs: ITesterantoConfig,
    private mode: IMode,
    private logError: (message: string, error?: any) => void,
    private logMessage: (message: string) => void,
    private resourceChanged: (path: string) => void,
    private getProcessSummary: () => any,
    private startServiceLogging: (
      serviceName: string,
      runtime: string,
      runtimeConfigKey: string,
    ) => Promise<void>,
  ) {
    this.builderServicesManager = new BuilderServicesManager(
      configs,
      mode,
      startServiceLogging,
    );
    this.aiderImageBuilder = new AiderImageBuilder(
      (message: string) => this.logMessage(message),
      (message: string, error?: any) => this.logError(message, error),
    );
  }

  generateServices(): Record<string, any> {
    return generateServicesPure(this.configs, this.mode);
  }

  async setupDockerCompose(): Promise<void> {
    writeComposeFile(this.generateServices(), this.configs);
  }

  async buildWithBuildKit(): Promise<Set<string>> {
    try {
      await this.buildAiderImage();
    } catch (error) {
      this.logError('[DockerComposeManager] Failed to build aider image:', error);
      // Continue despite aider image failure
    }

    try {
      const failedConfigs = await buildWithBuildKitPure(this.configs, (error: any) => {
        this.logError(error);
      });
      return failedConfigs;
    } catch (error) {
      this.logError('[DockerComposeManager] buildWithBuildKit failed:', error);
      // Return empty set - we'll treat all configs as potentially failed
      return new Set<string>();
    }
  }

  private async buildAiderImage(): Promise<void> {
    await this.aiderImageBuilder.buildAiderImage();
  }

  async startBuilderServices(): Promise<void> {
    try {
      await this.builderServicesManager.startBuilderServices();
    } catch (error) {
      this.logError('[DockerComposeManager] Failed to start builder services:', error);
      // Don't rethrow - allow the application to continue
    }
  }

  async DC_upAll(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPure();
    const result = await executeDockerComposeCommand(commands.up, {
      errorMessage: "docker compose up",
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await spawnPromise(commands.up);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error: any) {
        this.logError(`[Docker] docker compose up ❌ ${error.message}`);
        return {
          exitCode: 1,
          out: "",
          err: `Error starting services: ${error.message}`,
          data: null,
        };
      }
    }
    return result;
  }

  async DC_down(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPure();
    const result = await executeDockerComposeCommand(commands.down, {
      errorMessage: "docker compose down",
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await spawnPromise(commands.down);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error: any) {
        this.logMessage(`[DC_down] Error during down: ${error.message}`);
        return {
          exitCode: 1,
          out: "",
          err: `Error stopping services: ${error.message}`,
          data: null,
        };
      }
    }
    return result;
  }

  async DC_start(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPure();
    const result = await executeDockerComposeCommand(commands.start, {
      errorMessage: "docker compose start",
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await spawnPromise(commands.start);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error: any) {
        this.logError(`[Docker] docker compose start ❌ ${error.message}`);
        return {
          exitCode: 1,
          out: "",
          err: `Error starting services: ${error.message}`,
          data: null,
        };
      }
    }
    return result;
  }

  async DC_ps(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPure();
    return executeDockerComposeCommand(commands.ps, {
      useExec: true,
      execOptions: { cwd: processCwd() },
      errorMessage: "Error getting service status",
    });
  }

  async DC_logs(
    serviceName: string,
    options?: { follow?: boolean; tail?: number },
  ): Promise<IDockerComposeResult> {
    const tail = options?.tail ?? 100;
    const commands = getDockerComposeCommandsPure();
    const command = commands.logs(serviceName, tail);
    return executeDockerComposeCommand(command, {
      useExec: true,
      execOptions: { cwd: processCwd() },
      errorMessage: `Error getting logs for ${serviceName}`,
    });
  }

  async DC_configServices(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPure();
    return executeDockerComposeCommand(commands.config, {
      useExec: true,
      execOptions: { cwd: processCwd() },
      errorMessage: "Error getting services from config",
    });
  }

  writeConfigForExtension(processSummary: any): void {
    writeConfigForExtensionPure(
      this.configs,
      this.mode,
      processSummary,
      processCwd(),
    );
  }

  writeConfigForExtensionOnStop(): void {
    writeConfigForExtensionOnStop();
  }
}
