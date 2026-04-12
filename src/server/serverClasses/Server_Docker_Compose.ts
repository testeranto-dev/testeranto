import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { DockerComposeManager } from "./Server_Docker/DockerComposeManager";
import { type IDockerComposeResult } from "./Server_Docker/Server_Docker_Constants";
import {
  consoleError,
  consoleLog,
  processCwd,
} from "./Server_Docker/Server_Docker_Dependents";
import { Server_Docker_Test } from "./Server_Docker_Test";
import {
  executeDockerComposeCommandUtil,
  spawnPromiseUtil,
  generateServicesPureUtil,
  getDockerComposeCommandsPureUtil,
  writeComposeFileUtil
} from "./utils/dockerCoreUtils";

export abstract class Server_Docker_Compose extends Server_Docker_Test {
  dockerComposeManager: DockerComposeManager;

  abstract getProcessSummary: any;
  abstract startServiceLogging: any;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);

    this.dockerComposeManager = new DockerComposeManager(
      configs,
      mode,
      (message: string, error?: any) => consoleError(message, error),
      (message: string) => consoleLog(message),
      (path: string) => this.resourceChanged(path),
      () => this.getProcessSummary(),
      (serviceName: string, runtime: string, runtimeConfigKey: string) =>
        this.startServiceLogging(serviceName, runtime, runtimeConfigKey),
    );
  }

  generateServices(): Record<string, any> {
    return generateServicesPureUtil(this.configs, this.mode);
  }

  async setupDockerCompose() {
    writeComposeFileUtil(this.generateServices(), this.configs);
  }

  public async DC_upAll(): Promise<IDockerComposeResult> {
    // Clear builder logs before starting services
    if (typeof (this as any).clearBuilderLogs === 'function') {
      await (this as any).clearBuilderLogs();
    }

    const commands = getDockerComposeCommandsPureUtil();
    const result = await executeDockerComposeCommandUtil(commands.up, {
      errorMessage: "docker compose up",
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await spawnPromiseUtil(commands.up);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error: any) {
        consoleError(`[Docker] docker compose up ❌ ${error.message}`);
        // Don't throw - return a result indicating partial failure
        // This allows the application to continue with other operations
        return {
          exitCode: 1,
          out: "",
          err: `Error starting services: ${error.message}`,
          data: null,
        };
      }
    }
    // Even if the initial command failed, we can still continue
    // Log the error but don't prevent the application from running
    if (result.exitCode !== 0) {
      consoleError(`[Docker] docker compose up command failed: ${result.err}`);
    }
    return result;
  }

  public async DC_down(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPureUtil();
    const result = await executeDockerComposeCommandUtil(commands.down, {
      errorMessage: "docker compose down",
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await spawnPromiseUtil(commands.down);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error: any) {
        consoleLog(`[DC_down] Error during down: ${error.message}`);
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

  public async DC_ps(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPureUtil();
    return executeDockerComposeCommandUtil(commands.ps, {
      useExec: true,
      execOptions: { cwd: processCwd() },
      errorMessage: "Error getting service status",
    });
  }

  public async DC_logs(
    serviceName: string,
    options?: { follow?: boolean; tail?: number },
  ): Promise<IDockerComposeResult> {
    const tail = options?.tail ?? 100;
    const commands = getDockerComposeCommandsPureUtil();
    const command = commands.logs(serviceName, tail);
    return executeDockerComposeCommandUtil(command, {
      useExec: true,
      execOptions: { cwd: processCwd() },
      errorMessage: `Error getting logs for ${serviceName}`,
    });
  }

  public async DC_configServices(): Promise<IDockerComposeResult> {
    const commands = getDockerComposeCommandsPureUtil();
    return executeDockerComposeCommandUtil(commands.config, {
      useExec: true,
      execOptions: { cwd: processCwd() },
      errorMessage: "Error getting services from config",
    });
  }

  public async DC_start(): Promise<IDockerComposeResult> {
    // Clear builder logs before starting services
    if (typeof (this as any).clearBuilderLogs === 'function') {
      await (this as any).clearBuilderLogs();
    }

    const commands = getDockerComposeCommandsPureUtil();
    const result = await executeDockerComposeCommandUtil(commands.start, {
      errorMessage: "docker compose start",
    });
    if (result.exitCode === 0 && result.data?.spawn) {
      try {
        await spawnPromiseUtil(commands.start);
        return { exitCode: 0, out: "", err: "", data: null };
      } catch (error: any) {
        consoleError(`[Docker] docker compose start ❌ ${error.message}`);
        // Don't throw - return a result indicating partial failure
        return {
          exitCode: 1,
          out: "",
          err: `Error starting services: ${error.message}`,
          data: null,
        };
      }
    }
    // Even if the initial command failed, we can still continue
    if (result.exitCode !== 0) {
      consoleError(`[Docker] docker compose start command failed: ${result.err}`);
    }
    return result;
  }
}
