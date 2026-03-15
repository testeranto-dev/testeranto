import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import { Server_Docker } from "./Server_Docker";
import type { ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";

export class Server extends Server_Docker {
  private documentationWatcher: chokidar.FSWatcher | null = null;
  private documentationFiles: Set<string> = new Set();

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
  }

  async start(): Promise<void> {
    await super.start();
    
    // Start watching documentation files if glob pattern is provided
    if (this.configs.documentationGlob) {
      this.startDocumentationWatcher();
    }
  }

  async stop(): Promise<void> {
    // Stop watching documentation files
    if (this.documentationWatcher) {
      await this.documentationWatcher.close();
      this.documentationWatcher = null;
    }
    
    await super.stop();
  }

  private startDocumentationWatcher(): void {
    const globPattern = this.configs.documentationGlob!;
    const cwd = process.cwd();
    
    console.log(`[Server] Watching documentation files with pattern: ${globPattern}`);
    
    // Initialize watcher
    this.documentationWatcher = chokidar.watch(globPattern, {
      cwd,
      ignoreInitial: false,
      persistent: true,
    });

    // Add files that already exist
    this.documentationWatcher.on('add', (filePath: string) => {
      const absolutePath = path.join(cwd, filePath);
      this.documentationFiles.add(absolutePath);
      console.log(`[Server] Documentation file added: ${filePath}`);
      this.emitDocumentationUpdate();
    });

    // Handle file changes
    this.documentationWatcher.on('change', (filePath: string) => {
      console.log(`[Server] Documentation file changed: ${filePath}`);
      this.emitDocumentationUpdate();
    });

    // Handle file removal
    this.documentationWatcher.on('unlink', (filePath: string) => {
      const absolutePath = path.join(cwd, filePath);
      this.documentationFiles.delete(absolutePath);
      console.log(`[Server] Documentation file removed: ${filePath}`);
      this.emitDocumentationUpdate();
    });

    // Handle errors
    this.documentationWatcher.on('error', (error: Error) => {
      console.error(`[Server] Documentation watcher error:`, error);
    });

    // Log when ready
    this.documentationWatcher.on('ready', () => {
      console.log(`[Server] Documentation watcher is ready`);
    });
  }

  private emitDocumentationUpdate(): void {
    // Convert Set to array for easier serialization
    const files = Array.from(this.documentationFiles);
    
    // Here we would typically send this data to connected clients via WebSocket
    // For now, we'll log it and store it in a file that the VS Code extension can read
    const documentationData = {
      files: files.map(file => path.relative(process.cwd(), file)),
      timestamp: Date.now(),
    };

    // Write to a file that the VS Code extension can read
    const outputPath = path.join(process.cwd(), 'testeranto', 'documentation.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(documentationData, null, 2));
    
    console.log(`[Server] Updated documentation data (${files.length} files)`);
  }

  // Getter for documentation files (could be used by other parts of the system)
  getDocumentationFiles(): string[] {
    return Array.from(this.documentationFiles);
  }
}
