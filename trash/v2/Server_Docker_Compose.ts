import type { ITesterantoConfig } from "../../src/Types";
import type { IMode } from "../../src/server/types";
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
} from "./utils/Server_Docker_Compose_Utils";

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


  async start(): Promise<void> {
    console.log("mark1")
    await super.start();
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
    consoleLog(`[DC_upAll] Starting Docker Compose with command: ${commands.up}`);

    try {
      const result = await executeDockerComposeCommandUtil(commands.up, {
        errorMessage: "docker compose up",
      });

      if (result.exitCode === 0 && result.data?.spawn) {
        try {
          await spawnPromiseUtil(commands.up);
          consoleLog(`[DC_upAll] Docker Compose up command executed successfully`);
          return { exitCode: 0, out: "", err: "", data: null };
        } catch (error: any) {
          consoleError(`[DC_upAll] docker compose up spawn failed: ${error.message}`);
          return {
            exitCode: 1,
            out: "",
            err: `Error starting services: ${error.message}`,
            data: null,
          };
        }
      } else if (result.exitCode !== 0) {
        consoleError(`[DC_upAll] docker compose up command failed with exit code ${result.exitCode}: ${result.err}`);
        return result;
      }

      // If we reach here, the command may have succeeded without spawn
      consoleLog(`[DC_upAll] Docker Compose services started`);
      return result;
    } catch (error: any) {
      consoleError(`[DC_upAll] Unexpected error during DC_upAll: ${error.message}`);
      return {
        exitCode: 1,
        out: "",
        err: `Unexpected error: ${error.message}`,
        data: null,
      };
    }
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
