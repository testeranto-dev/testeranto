import { Server_Aider } from "./Server_Aider";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";

/**
 * Server_Logs - Business Layer (-2.5)
 * 
 * Extends: Server_Aider (-3)
 * Extended by: Server_Lock (-2)
 * Provides: Log formatting and structure business logic
 */
export abstract class Server_Logs extends Server_Aider {
  protected logLevels = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4
  };

  protected currentLogLevel: number = this.logLevels.INFO;
  protected logFormats: Map<string, (level: string, message: string, meta?: any) => string> = new Map();
  protected logStructures: Map<string, any> = new Map();

  constructor(
    configs: ITesterantoConfig,
    mode: IMode,
    getCurrentTestResults: () => any,
    projectRoot?: string,
    resourceChangedCallback?: (path: string) => void
  ) {
    super(configs, mode, getCurrentTestResults, projectRoot, resourceChangedCallback);
    this.initializeLogFormats();
    this.initializeLogStructures();
  }

  // ========== Abstract STDIO Methods ==========
  // These will be implemented by Server_STDIO or other technological layers

  /**
   * Write data to stdout
   */
  protected abstract writeStdout(data: string | Buffer): boolean;

  /**
   * Write data to stderr
   */
  protected abstract writeStderr(data: string | Buffer): boolean;

  /**
   * Read from stdin
   */
  protected abstract readStdin(encoding?: BufferEncoding): Promise<string>;

  // ========== Log Level Management ==========

  setLogLevel(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'): void {
    this.currentLogLevel = this.logLevels[level];
    this.logBusinessMessage(`Log level set to ${level}`);
  }

  getLogLevel(): string {
    for (const [level, value] of Object.entries(this.logLevels)) {
      if (value === this.currentLogLevel) {
        return level;
      }
    }
    return 'INFO';
  }

  shouldLog(level: string): boolean {
    const levelValue = this.logLevels[level as keyof typeof this.logLevels];
    return levelValue >= this.currentLogLevel;
  }

  // ========== Log Formatting ==========

  private initializeLogFormats(): void {
    // JSON format
    this.logFormats.set('json', (level, message, meta) => {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta
      });
    });

    // Text format
    this.logFormats.set('text', (level, message, meta) => {
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
      return `[${new Date().toISOString()}] [${level}] ${message}${metaStr}`;
    });

    // Simple format
    this.logFormats.set('simple', (level, message) => {
      return `[${level}] ${message}`;
    });

    // Structured format (for machine parsing)
    this.logFormats.set('structured', (level, message, meta) => {
      const base = {
        ts: Date.now(),
        lvl: level.charAt(0),
        msg: message
      };
      if (meta) {
        return { ...base, ...meta };
      }
      return base;
    });
  }

  private initializeLogStructures(): void {
    // Test log structure
    this.logStructures.set('test', {
      testName: '',
      configKey: '',
      runtime: '',
      status: '',
      duration: 0,
      assertions: [],
      errors: []
    });

    // Process log structure
    this.logStructures.set('process', {
      processId: '',
      processType: '',
      serviceName: '',
      containerId: '',
      status: '',
      startedAt: '',
      finishedAt: '',
      exitCode: null,
      logs: []
    });

    // Docker log structure
    this.logStructures.set('docker', {
      containerId: '',
      containerName: '',
      serviceName: '',
      event: '',
      timestamp: '',
      state: '',
      exitCode: null
    });

    // Agent log structure
    this.logStructures.set('agent', {
      agentName: '',
      action: '',
      timestamp: '',
      input: null,
      output: null,
      duration: 0
    });
  }

  // ========== Log Writing Methods ==========

  log(level: string, message: string, meta?: any, format: string = 'text'): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formatter = this.logFormats.get(format);
    if (!formatter) {
      this.writeStderr(`Unknown log format: ${format}`);
      return;
    }

    const formatted = formatter(level, message, meta);

    // Write to appropriate stream based on level
    if (level === 'ERROR' || level === 'FATAL') {
      this.writeStderr(formatted);
    } else {
      this.writeStdout(formatted);
    }
  }

  debug(message: string, meta?: any, format?: string): void {
    this.log('DEBUG', message, meta, format);
  }

  info(message: string, meta?: any, format?: string): void {
    this.log('INFO', message, meta, format);
  }

  warn(message: string, meta?: any, format?: string): void {
    this.log('WARN', message, meta, format);
  }

  error(message: string, meta?: any, format?: string): void {
    this.log('ERROR', message, meta, format);
  }

  fatal(message: string, meta?: any, format?: string): void {
    this.log('FATAL', message, meta, format);
  }

  // ========== Structured Logging ==========

  createStructuredLog(structureType: string, data: any): any {
    const structure = this.logStructures.get(structureType);
    if (!structure) {
      this.error(`Unknown log structure type: ${structureType}`);
      return data;
    }

    // Merge structure template with provided data
    const result = { ...structure };
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        result[key] = data[key];
      }
    }

    // Fill in defaults
    if (!result.timestamp && !result.ts) {
      result.timestamp = new Date().toISOString();
    }

    return result;
  }

  logStructured(structureType: string, data: any, format: string = 'json'): void {
    const structured = this.createStructuredLog(structureType, data);
    this.log('INFO', structured.message || `Structured log: ${structureType}`, structured, format);
  }

  // ========== Log Aggregation ==========

  aggregateLogs(logs: any[], aggregationKey: string): Map<string, any[]> {
    const aggregated = new Map();

    for (const log of logs) {
      const key = log[aggregationKey];
      if (!key) continue;

      if (!aggregated.has(key)) {
        aggregated.set(key, []);
      }
      aggregated.get(key).push(log);
    }

    return aggregated;
  }

  summarizeLogs(logs: any[]): any {
    const summary = {
      total: logs.length,
      byLevel: new Map(),
      bySource: new Map(),
      errors: 0,
      warnings: 0,
      startTime: null as Date | null,
      endTime: null as Date | null
    };

    for (const log of logs) {
      // Count by level
      const level = log.level || 'INFO';
      summary.byLevel.set(level, (summary.byLevel.get(level) || 0) + 1);

      // Count errors and warnings
      if (level === 'ERROR' || level === 'FATAL') summary.errors++;
      if (level === 'WARN') summary.warnings++;

      // Track by source if available
      const source = log.source || log.serviceName || log.containerId || 'unknown';
      summary.bySource.set(source, (summary.bySource.get(source) || 0) + 1);

      // Track time range
      const timestamp = log.timestamp ? new Date(log.timestamp) : null;
      if (timestamp) {
        if (!summary.startTime || timestamp < summary.startTime) {
          summary.startTime = timestamp;
        }
        if (!summary.endTime || timestamp > summary.endTime) {
          summary.endTime = timestamp;
        }
      }
    }

    return summary;
  }

  /**
   * Stream Docker build logs to stdout.
   * This is the testable business logic – it pipes a Readable stream
   * to the abstract writeStdout method.
   */
  streamDockerBuildLogs(stream: NodeJS.ReadableStream): void {
    stream.on('data', (chunk: Buffer | string) => {
      this.writeStdout(chunk);
    });
    stream.on('error', (err: Error) => {
      this.writeStderr(`[DockerBuild] error: ${err.message}\n`);
    });
  }

  // ========== Log Filtering ==========

  filterLogs(logs: any[], filter: (log: any) => boolean): any[] {
    return logs.filter(filter);
  }

  filterByLevel(logs: any[], level: string): any[] {
    return this.filterLogs(logs, log => log.level === level);
  }

  filterByTimeRange(logs: any[], startTime: Date, endTime: Date): any[] {
    return this.filterLogs(logs, log => {
      if (!log.timestamp) return false;
      const logTime = new Date(log.timestamp);
      return logTime >= startTime && logTime <= endTime;
    });
  }

  filterBySource(logs: any[], source: string): any[] {
    return this.filterLogs(logs, log => {
      const logSource = log.source || log.serviceName || log.containerId;
      return logSource === source;
    });
  }

  // ========== Setup and Cleanup ==========

  async setupLogs(): Promise<void> {
    this.logBusinessMessage("Setting up log system...");
    // Initialize log files, configure log rotation, etc.
    this.logBusinessMessage("Log system setup complete");
  }

  async cleanupLogs(): Promise<void> {
    this.logBusinessMessage("Cleaning up log system...");
    // Close log files, flush buffers, etc.
    this.logBusinessMessage("Log system cleaned up");
  }

  async notifyLogsStarted(): Promise<void> {
    this.logBusinessMessage("Log system notified of server start");
    this.info("Server started", { mode: this.mode, timestamp: new Date().toISOString() });
  }

  async notifyLogsStopped(): Promise<void> {
    this.logBusinessMessage("Log system notified of server stop");
  }

  // ========== Workflow Methods ==========

  async startLogProcessing(): Promise<void> {
    this.logBusinessMessage("Starting log processing...");
    // Start log aggregation, monitoring, etc.
    this.logBusinessMessage("Log processing started");
  }

  async stopLogProcessing(): Promise<void> {
    this.logBusinessMessage("Stopping log processing...");
    // Stop log processing workflows
    this.logBusinessMessage("Log processing stopped");
  }

  // ========== Integration with Parent Methods ==========

  // Override logBusinessMessage to use structured logging
  protected logBusinessMessage(message: string): void {
    this.info(message, { category: 'business', source: this.constructor.name });
  }

  protected logBusinessError(message: string, error?: any): void {
    this.error(message, {
      category: 'business',
      source: this.constructor.name,
      error: error?.message || String(error),
      stack: error?.stack
    });
  }

  protected logBusinessWarning(message: string): void {
    this.warn(message, { category: 'business', source: this.constructor.name });
  }
}
