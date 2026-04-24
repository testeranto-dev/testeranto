// This forms  the base of the server stack
// in this fail we should define many mehtods as abstractthat will be implemented by highersclases
import type { ITesterantoConfig } from "../../../Types";
import type { IMode } from "../../types";

export abstract class Server_Base {
  protected configs: ITesterantoConfig;
  protected mode: IMode;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    this.configs = configs;
    this.mode = mode;
    
    // Normalize configs (from V2 Server_Base)
    this.normalizeConfigs();
  }

  // Normalize configuration
  private normalizeConfigs(): void {
    // This is a placeholder for actual normalization logic
    // In V2, it calls normalizeConfigsUtil
    // No logging in constructors per SOUL principles
  }

  // ========== Abstract Technological Methods ==========
  // These will be implemented by higher technological layers
  
  /**
   * Read a file from the filesystem
   */
  protected abstract readFile(path: string): Promise<string>;

  /**
   * Write a file to the filesystem
   */
  protected abstract writeFile(path: string, content: string): Promise<void>;

  /**
   * Check if a file exists
   */
  protected abstract fileExists(path: string): Promise<boolean>;

  /**
   * Execute a command
   */
  protected abstract execCommand(command: string, options?: any): Promise<{ stdout: string; stderr: string; exitCode: number }>;

  /**
   * Write to stdout
   */
  protected abstract writeStdout(data: string | Buffer): boolean;

  /**
   * Write to stderr
   */
  protected abstract writeStderr(data: string | Buffer): boolean;

  /**
   * Read from stdin
   */
  protected abstract readStdin(encoding?: BufferEncoding): Promise<string>;

  // ========== Logging Methods ==========
  // These are available to all classes in the inheritance chain

  /**
   * Log a business-level message.
   * Default implementation uses console.log.
   */
  protected logBusinessMessage(message: string): void {
    console.log(`[Business] ${message}`);
  }

  /**
   * Log a business-level error.
   * Default implementation uses console.error.
   */
  protected logBusinessError(message: string, error?: any): void {
    console.error(`[Business] ${message}`, error);
  }

  /**
   * Log a business-level warning.
   * Default implementation uses console.warn.
   */
  protected logBusinessWarning(message: string): void {
    console.warn(`[Business] ${message}`);
  }

  /**
   * Broadcast a message to all WebSocket clients.
   * Implemented by technological layers (Server_WS_HTTP).
   */
  protected abstract broadcastApiMessage(
    messageType: string,
    data: any,
    filter?: (client: any) => boolean
  ): void;
}
