// BuildKit Utilities for Testeranto
// This module provides BuildKit integration for on-demand builds

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BuildKitBuildOptions {
  runtime: string;
  configKey: string;
  dockerfilePath: string;
  buildContext: string;
  cacheMounts: string[];
  targetStage?: string;
  buildArgs?: Record<string, string>;
}

export interface BuildKitBuildResult {
  success: boolean;
  imageId?: string;
  error?: string;
  logs: string;
  duration: number;
}

export class BuildKitBuilder {
  /**
   * Build a Docker image using BuildKit with cache optimization
   */
  static async buildImage(options: BuildKitBuildOptions): Promise<BuildKitBuildResult> {
    const startTime = Date.now();

    // Prepare BuildKit-specific arguments
    const buildArgs = options.buildArgs ?
      Object.entries(options.buildArgs).map(([key, value]) => `--build-arg ${key}=${value}`).join(' ') : '';

    const targetStage = options.targetStage ? `--target ${options.targetStage}` : '';
    // If targetStage is undefined or empty, no --target flag will be added

    // Determine image name
    let imageName: string;
    if (options.runtime === 'aider') {
      imageName = 'testeranto-aider:latest';
    } else {
      imageName = `testeranto-${options.runtime}-${options.configKey}:latest`;
    }

    // Build command using BuildKit
    const buildCommand = `DOCKER_BUILDKIT=1 docker build \
      ${buildArgs} \
      ${targetStage} \
      -f ${options.dockerfilePath} \
      -t ${imageName} \
      ${options.buildContext}`;

    try {
      const { stdout, stderr } = await execAsync(buildCommand, {
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large builds
      });

      const duration = Date.now() - startTime;

      // Extract image ID from output
      const imageIdMatch = stdout.match(/Successfully built ([a-f0-9]+)/) ||
        stderr.match(/Successfully built ([a-f0-9]+)/);
      const imageId = imageIdMatch ? imageIdMatch[1] : undefined;

      return {
        success: true,
        imageId,
        logs: stdout + stderr,
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        logs: error.stderr || error.stdout || error.message,
        duration
      };
    }
  }


  /**
   * Create a BuildKit-based docker-compose service configuration
   */
  static createBuildKitService(
    runtime: string,
    configKey: string,
    testName: string,
    command: string
  ): any {
    const serviceName = `${configKey}-${testName}-buildkit`;

    const baseService: any = {
      image: `testeranto-${runtime}-${configKey}:latest`,
      container_name: serviceName,
      environment: {
        NODE_ENV: "production",
        ENV: runtime
      },
      working_dir: "/workspace",
      volumes: [
        `${process.cwd()}/src:/workspace/src`,
        `${process.cwd()}/dist:/workspace/dist`,
        `${process.cwd()}/testeranto:/workspace/testeranto`,
        // Note: node_modules is NOT mounted to avoid platform incompatibility
      ],
      command: command,
      networks: ["allTests_network"]
      // Note: No 'build' field - image is pre-built with BuildKit
    };

    // Add runtime-specific configurations
    if (runtime === 'web') {
      // Web runtime needs additional ports and environment
      baseService.expose = ["9223", "8000"];
      baseService.environment = {
        ...baseService.environment,
        PUPPETEER_EXECUTABLE_PATH: "/usr/bin/chromium-browser",
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "true"
      };
    }

    return {
      [serviceName]: baseService
    };
  }

  /**
   * Check if BuildKit is available
   */
  static async checkBuildKitAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('docker buildx version');
      return stdout.includes('buildx') || stdout.includes('BuildKit');
    } catch (error) {
      console.error('[BuildKit] BuildKit not available');
      return false;
    }
  }
}
