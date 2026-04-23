import fs from 'fs/promises';
import pathModule from 'path';
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Server } from "../Server";

/**
 * Server_FS - Technological Layer (+1)
 * 
 * Extends: Server (0)
 * Extended by: Server_CommandLine (+2)
 * Provides: File system operations
 * To be mocked in: Tests
 */
export class Server_FS extends Server {
  private fileWatchers: Map<string, () => void> = new Map();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  cwd() {
    return `~/Code/testeranto`
  }

  // File reading operations
  async readFile(path: string): Promise<string> {
    return await fs.readFile(path, 'utf-8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    await fs.writeFile(path, content, 'utf-8');
  }

  async mkdir(path: string, recursive?: boolean): Promise<void> {
    await fs.mkdir(path, { recursive: recursive ?? false });
  }

  // File watching operations
  watchFile(path: string, callback: (event: string) => void): () => void {
    const watcher = fs.watch(path, (eventType: string) => {
      callback(eventType);
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
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async readdir(path: string): Promise<string[]> {
    return await fs.readdir(path);
  }

  async stat(path: string): Promise<any> {
    return await fs.stat(path);
  }

  async copyFile(src: string, dest: string): Promise<void> {
    await fs.copyFile(src, dest);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await fs.rename(oldPath, newPath);
  }

  async rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void> {
    await fs.rm(path, {
      recursive: options?.recursive ?? false,
      force: options?.force ?? false
    });
  }
}
