import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_FS } from "../technological/Server_FS";
import { executeRuntimeBuild } from "../utils/runtime/buildUtils";
import { generateRuntimeDockerCompose } from "../utils/runtime/dockerComposeUtils";
import { getRuntimeDockerfilePath, getRuntimeVolumes } from "../utils/runtime/pathUtils";
import { validateRuntimeConfiguration } from "../utils/runtime/validationUtils";
import { Server_Polyglot } from "./Server_Polyglot";

export class Server_Runtime extends Server_Polyglot {
  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  async executeRuntimeBuild(runtime: string, configKey: string): Promise<void> {
    await executeRuntimeBuild(this.configs, runtime, configKey);
  }

  async generateRuntimeDockerCompose(runtime: string, configKey: string, testName: string): Promise<string> {
    return await generateRuntimeDockerCompose(this.configs, runtime, configKey, testName);
  }

  async executeRuntimeCommand(runtime: string, command: string): Promise<{ stdout: string; stderr: string }> {
    const result = await this.execCommand(command);
    return {
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  getRuntimeDockerfilePath(runtime: string): string {
    return getRuntimeDockerfilePath(this.configs, runtime);
  }

  getRuntimeVolumes(runtime: string): string[] {
    return getRuntimeVolumes(runtime);
  }

  getRuntimeBuildContext(runtime: string, configKey: string): string {
    // Default build context is the project root
    // Override in subclasses if needed
    return process.cwd();
  }

  validateRuntimeConfiguration(runtime: string, configKey: string): void {
    validateRuntimeConfiguration(this.configs, runtime, configKey);
  }
}
