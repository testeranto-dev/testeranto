import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_Static } from "./Server_Static";

// Import V2 build functions
import { nodeBuildKitBuild } from "../../../runtimes/node/docker";
import { webBuildKitBuild } from "../../../runtimes/web/docker";
import { pythonBuildKitBuild } from "../../../runtimes/python/docker";
import { rubyBuildKitBuild } from "../../../runtimes/ruby/docker";
import { javaBuildKitBuild } from "../../../runtimes/java/docker";
import { golangBuildKitBuild } from "../../../runtimes/golang/docker";
import { rustBuildKitBuild } from "../../../runtimes/rust/docker";

export abstract class Server_Polyglot extends Server_Static {
  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    getCurrentTestResults: () => any,
    projectRoot?: string,
    resourceChangedCallback?: (path: string) => void
  ) {
    super(configs, mode, getCurrentTestResults, projectRoot, resourceChangedCallback);
  }

  async setupPolyglotRuntimes(): Promise<void> {
    console.log(`[Polyglot] Setting up runtimes...`);
    
    for (const [configKey, runtimeConfig] of Object.entries(this.configs.runtimes)) {
      const runtime = runtimeConfig.runtime;
      
      console.log(`[Polyglot] Building ${runtime} image for ${configKey}...`);
      
      try {
        switch (runtime) {
          case 'node':
            await nodeBuildKitBuild(this.configs, configKey);
            break;
          case 'web':
            await webBuildKitBuild(this.configs, configKey);
            break;
          case 'python':
            await pythonBuildKitBuild(this.configs, configKey);
            break;
          case 'ruby':
            await rubyBuildKitBuild(this.configs, configKey);
            break;
          case 'java':
            await javaBuildKitBuild(this.configs, configKey);
            break;
          case 'golang':
            await golangBuildKitBuild(this.configs, configKey);
            break;
          case 'rust':
            await rustBuildKitBuild(this.configs, configKey);
            break;
          default:
            throw new Error(`Unsupported runtime: ${runtime} for config ${configKey}`);
        }
        
        console.log(`[Polyglot] ✓ ${runtime} image built for ${configKey}`);
      } catch (error: any) {
        console.error(`[Polyglot] ✗ Failed to build ${runtime} image for ${configKey}:`, error.message);
        throw error;
      }
    }
    
    console.log(`[Polyglot] All runtime images built`);
  }

  private async buildNodeRuntime(configKey: string, config: any): Promise<void> {
    // This method is kept for compatibility but should not be called
    // because we now use the imported V2 function directly in setupPolyglotRuntimes
    throw new Error('buildNodeRuntime should not be called - use nodeBuildKitBuild directly');
  }

  private async buildWebRuntime(configKey: string, config: any): Promise<void> {
    throw new Error('buildWebRuntime should not be called - use webBuildKitBuild directly');
  }

  private async buildPythonRuntime(configKey: string, config: any): Promise<void> {
    throw new Error('buildPythonRuntime should not be called - use pythonBuildKitBuild directly');
  }

  private async buildRubyRuntime(configKey: string, config: any): Promise<void> {
    throw new Error('buildRubyRuntime should not be called - use rubyBuildKitBuild directly');
  }

  private async buildJavaRuntime(configKey: string, config: any): Promise<void> {
    throw new Error('buildJavaRuntime should not be called - use javaBuildKitBuild directly');
  }

  private async buildGolangRuntime(configKey: string, config: any): Promise<void> {
    throw new Error('buildGolangRuntime should not be called - use golangBuildKitBuild directly');
  }

  private async buildRustRuntime(configKey: string, config: any): Promise<void> {
    throw new Error('buildRustRuntime should not be called - use rustBuildKitBuild directly');
  }

  async startPolyglotWorkflows(): Promise<void> {
    // No-op for now
  }

  async stopPolyglotWorkflows(): Promise<void> {
    // No-op for now
  }

  analyzePolyglotTestResults(): any {
    return {};
  }

  getRuntimeStatus(runtime: string): string {
    return "active";
  }

  // Helper method to execute commands - not used anymore because we use V2 build functions
  private async execCommand(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    throw new Error('execCommand should not be called in Server_Polyglot - use V2 build functions instead');
  }
}
