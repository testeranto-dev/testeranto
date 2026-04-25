import fs from 'fs';
import fsp from 'fs/promises';
import pathModule from 'path';
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server_Files } from "../business/Server_Files";
import { EventQueue } from '../business/utils/EventQueue';

/**
 * Server_FS - Technological Layer (+1)
 * 
 * Extends: Server (0)
 * Extended by: Server_CommandLine (+2)
 * Provides: File system operations
 * To be mocked in: Tests
 */
export class Server_FS extends Server_Files {
  private fileWatchers: Map<string, () => void> = new Map();
  protected fileEventQueue: EventQueue<any> = new EventQueue();

  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    getCurrentTestResults: () => any = () => ({}),
    projectRoot: string = process.cwd(),
    resourceChangedCallback: (path: string) => void = () => { },
  ) {
    super(configs, mode, getCurrentTestResults, projectRoot, resourceChangedCallback);
  }

  cwd() {
    return `~/Code/testeranto`
  }

  // File reading operations
  async readFile(path: string): Promise<string> {
    return await fsp.readFile(path, 'utf-8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    await fsp.writeFile(path, content, 'utf-8');
  }

  async mkdir(path: string, recursive?: boolean): Promise<void> {
    await fsp.mkdir(path, { recursive: recursive ?? false });
  }

  // File watching operations
  watchFile(path: string, callback: (event: string) => void): () => void {
    console.log(`[Server_FS] Setting up watcher for: ${path}`);
    const watcher = fs.watch(path, (eventType: string | Buffer, filename: string | Buffer | null) => {
      const event = typeof eventType === 'string' ? eventType : eventType.toString();
      console.log(`[Server_FS] File change detected: ${path} (event: ${event})`);
      callback(event);
    });

    const unwatch = () => {
      watcher.close();
      this.fileWatchers.delete(path);
    };

    this.fileWatchers.set(path, unwatch);
    return unwatch;
  }

  unwatchFile(path: string): void {
    const unwatch = this.fileWatchers.get(path);
    if (unwatch) {
      unwatch();
      this.fileWatchers.delete(path);
    }
  }

  // Path utilities
  joinPaths(...paths: string[]): string {
    const path = require('path');
    return path.join(...paths);
  }

  resolvePath(path: string): string {
    return pathModule.resolve(path);
  }

  isAbsolutePath(path: string): boolean {
    return pathModule.isAbsolute(path);
  }

  // Additional file operations
  async fileExists(path: string): Promise<boolean> {
    try {
      await fsp.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async readdir(path: string): Promise<string[]> {
    return await fsp.readdir(path);
  }

  async stat(path: string): Promise<any> {
    return await fsp.stat(path);
  }

  async copyFile(src: string, dest: string): Promise<void> {
    await fsp.copyFile(src, dest);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await fsp.rename(oldPath, newPath);
  }

  async rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void> {
    await fsp.rm(path, {
      recursive: options?.recursive ?? false,
      force: options?.force ?? false
    });
  }

  // Implement abstract methods from Server_Files

  protected async scheduleTest(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    console.log(`[Server_FS] scheduleTest called: runtime=${runtime}, testName=${testName}, configKey=${configKey}`);
    // Launch BDD and checks (not aider) when input files change
    await this.launchBddTest(runtime, testName, configKey, configValue);
    await this.launchChecks(runtime, testName, configKey, configValue);
    // Actually start a Docker process for the test
    await this.startDockerProcess(runtime, testName, configKey, configValue);
  }

  protected async updateGraphWithTestResult(
    configKey: string,
    testName: string,
    testResult: any,
  ): Promise<void> {
    console.log(`[Server_FS] updateGraphWithTestResult called: configKey=${configKey}, testName=${testName}`);
    // Graph update will be handled by Server_Graph layer
  }

  protected async updateFeatureNode(
    featurePath: string,
    frontmatter: any,
  ): Promise<void> {
    console.log(`[Server_FS] updateFeatureNode called: featurePath=${featurePath}`);
    // Feature node update will be handled by Server_Graph layer
  }

  protected async startDockerProcess(
    runtime: string,
    testName: string,
    configKey: string,
    configValue: any,
  ): Promise<void> {
    console.log(`[Server_FS] startDockerProcess called: runtime=${runtime}, testName=${testName}, configKey=${configKey}`);
    // This method is overridden by Server_DockerCompose to actually start the Docker service.
    // The default implementation is a no-op to avoid errors when the override is not present.
  }

}
