import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import { Server_Docker } from "./Server_Docker";
import type { ITestconfigV2 } from "../../Types";
import type { IMode } from "../types";
import glob from "glob";

export class Server extends Server_Docker {
  private documentationWatcher: chokidar.FSWatcher | null = null;
  private documentationFiles: Set<string> = new Set();

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
  }

  async start(): Promise<void> {
    await super.start();
    if (this.configs.documentationGlob) {
      console.log(`[Server] Starting documentation watcher with glob: ${this.configs.documentationGlob}`);
      this.startDocumentationWatcher();
    } else {
      console.log('[Server] No documentationGlob configured in configs');
    }
  }

  async stop(): Promise<void> {
    if (this.documentationWatcher) {
      await this.documentationWatcher.close();
      this.documentationWatcher = null;
    }
    await super.stop();
  }

  private startDocumentationWatcher(): void {
    console.log('[Server] startDocumentationWatcher')

    const globPattern = this.configs.documentationGlob!;
    const cwd = process.cwd();

    // Normalize glob pattern: remove leading ./ if present
    const normalizedGlob = globPattern.replace(/^\.\//, '');
    console.log(`[Server] Normalized glob pattern: ${normalizedGlob} in cwd: ${cwd}`);

    // Manually find files to debug and add them immediately
    const files = glob.sync(normalizedGlob, {
      cwd,
      ignore: ['**/node_modules/**', '**/.git/**'],
      nodir: true
    });
    console.log(`[Server] Manual glob found ${files.length} files:`, files);

    // Add found files to documentationFiles
    for (const file of files) {
      const absolutePath = path.join(cwd, file);
      this.documentationFiles.add(absolutePath);
    }
    console.log(`[Server] Added ${files.length} files to documentationFiles`);
    // Emit update immediately with found files
    this.emitDocumentationUpdate();

    this.documentationWatcher = chokidar.watch(normalizedGlob, {
      cwd,
      ignoreInitial: false,
      persistent: true,
      ignored: ['**/node_modules/**', '**/.git/**'],
      alwaysStat: false,
      usePolling: false,
      depth: 99
    });

    // Collect initial files
    let initialAdds = 0;

    this.documentationWatcher.on('add', (filePath: string) => {
      console.log('[Server] add', filePath)
      const absolutePath = path.join(cwd, filePath);
      this.documentationFiles.add(absolutePath);
      initialAdds++;
      // Don't emit on every add during initial scan to avoid excessive updates
    });

    this.documentationWatcher.on('change', (filePath: string) => {
      console.log('[Server] change', filePath)
      this.emitDocumentationUpdate();
    });

    this.documentationWatcher.on('unlink', (filePath: string) => {
      console.log('[Server] delete', filePath)
      const absolutePath = path.join(cwd, filePath);
      this.documentationFiles.delete(absolutePath);
      this.emitDocumentationUpdate();
    });

    this.documentationWatcher.on('ready', () => {
      console.log(`[Server] watching ${normalizedGlob}, found ${initialAdds} initial files`)
      // Don't emit here because we already emitted after manual scan
      // The watcher is now ready to track changes
    });

    this.documentationWatcher.on('error', (error) => {
      console.error('[Server] Documentation watcher error:', error);
    });
  }

  private emitDocumentationUpdate(): void {
    const files = Array.from(this.documentationFiles);
    const relativeFiles = files.map(file => path.relative(process.cwd(), file));
    console.log(`[Server] emitDocumentationUpdate: ${relativeFiles.length} files`);
    const documentationData = {
      files: relativeFiles,
      timestamp: Date.now(),
    };
    const outputPath = path.join(process.cwd(), 'testeranto', 'documentation.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(documentationData, null, 2));
    console.log(`[Server] Broadcasting documentation update via WebSocket`);
    this.resourceChanged("/~/documentation");
  }

  getDocumentationFiles(): string[] {
    const cwd = process.cwd();
    const files = Array.from(this.documentationFiles).map(file => {
      const relative = path.relative(cwd, file);
      // Ensure we use forward slashes for consistency
      const normalized = relative.split(path.sep).join('/');
      console.log(`[Server] getDocumentationFiles: ${file} -> ${relative} -> ${normalized}`);
      return normalized;
    });
    console.log(`[Server] getDocumentationFiles returning ${files.length} files:`, files);
    return files;
  }
}
