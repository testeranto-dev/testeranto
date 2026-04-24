import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_Static } from "./Server_Static";


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
        const dockerfilePath = this.getRuntimeDockerfilePath(runtime);
        const buildContext = this.getRuntimeBuildContext(runtime, configKey);
        
        const { stdout, stderr } = await this.spawnDockerBuild(buildContext, dockerfilePath);
        
        // Stream build logs to stdout
        this.streamDockerBuildLogs(stdout);
        
        // Also capture stderr for error reporting
        stderr.on('data', (chunk: Buffer | string) => {
          this.writeStderr(chunk);
        });
        
        // Wait for the build to complete
        await new Promise<void>((resolve, reject) => {
          stdout.on('end', resolve);
          stderr.on('end', resolve);
          stdout.on('error', reject);
          stderr.on('error', reject);
        });
        
        console.log(`[Polyglot] ✓ ${runtime} image built for ${configKey}`);
      } catch (error: any) {
        console.error(`[Polyglot] ✗ Failed to build ${runtime} image for ${configKey}:`, error.message);
        throw error;
      }
    }
    
    console.log(`[Polyglot] All runtime images built`);
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

}
