import { Server_CommandLine } from "./Server_CommandLine";
import type { ITesterantoConfig } from "../../../../Types";
import type { IMode } from "../../../types";
import { Readable, Writable } from 'stream';

/**
 * Server_STDIO - Technological Layer (+2.5)
 * 
 * Extends: Server_CommandLine (+2)
 * Extended by: Server_HTTP (+3)
 * Provides: Mockable STDIO operations (stdin, stdout, stderr)
 * To be mocked in: Tests
 */
export class Server_STDIO extends Server_CommandLine {
  protected stdin: Readable;
  protected stdout: Writable;
  protected stderr: Writable;
  protected stdioListeners: Map<string, Function[]> = new Map();

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
    
    // Initialize with default streams (process.stdin, process.stdout, process.stderr)
    this.stdin = process.stdin;
    this.stdout = process.stdout;
    this.stderr = process.stderr;
  }

  // ========== STDIO Configuration ==========
  
  /**
   * Set custom stdin stream
   */
  setStdin(stream: Readable): void {
    this.stdin = stream;
    this.logBusinessMessage("Stdin stream configured");
  }

  /**
   * Set custom stdout stream
   */
  setStdout(stream: Writable): void {
    this.stdout = stream;
    this.logBusinessMessage("Stdout stream configured");
  }

  /**
   * Set custom stderr stream
   */
  setStderr(stream: Writable): void {
    this.stderr = stream;
    this.logBusinessMessage("Stderr stream configured");
  }

  /**
   * Reset to default streams (process.stdin/stdout/stderr)
   */
  resetStdio(): void {
    this.stdin = process.stdin;
    this.stdout = process.stdout;
    this.stderr = process.stderr;
    this.logBusinessMessage("STDIO streams reset to defaults");
  }

  // ========== STDIO Reading Operations ==========
  
  /**
   * Read from stdin with optional encoding
   */
  async readStdin(encoding: BufferEncoding = 'utf-8'): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';
      this.stdin.setEncoding(encoding);
      this.stdin.on('data', (chunk) => {
        data += chunk;
      });
      this.stdin.on('end', () => {
        resolve(data);
      });
      this.stdin.on('error', reject);
      
      // If stdin is already ended (e.g., piped input), we need to handle it
      if (this.stdin.readableEnded) {
        resolve(data);
      }
    });
  }

  /**
   * Read a line from stdin
   */
  async readLine(): Promise<string> {
    // Simple implementation without readline
    // Read from stdin until newline or EOF
    return new Promise((resolve) => {
      let data = '';
      const onData = (chunk: Buffer | string) => {
        const str = chunk.toString();
        const newlineIndex = str.indexOf('\n');
        if (newlineIndex !== -1) {
          // Found newline
          data += str.substring(0, newlineIndex);
          // Remove listeners
          this.stdin.off('data', onData);
          this.stdin.off('end', onEnd);
          resolve(data);
        } else {
          data += str;
        }
      };
      
      const onEnd = () => {
        this.stdin.off('data', onData);
        this.stdin.off('end', onEnd);
        resolve(data);
      };
      
      this.stdin.on('data', onData);
      this.stdin.on('end', onEnd);
      
      // If stdin is already ended, resolve with empty string
      if (this.stdin.readableEnded) {
        this.stdin.off('data', onData);
        this.stdin.off('end', onEnd);
        resolve('');
      }
    });
  }

  // ========== STDIO Writing Operations ==========
  
  /**
   * Write to stdout
   */
  writeStdout(data: string | Buffer): boolean {
    return this.stdout.write(data);
  }

  /**
   * Write to stderr
   */
  writeStderr(data: string | Buffer): boolean {
    return this.stderr.write(data);
  }

  /**
   * Write line to stdout (with newline)
   */
  writeLine(data: string): boolean {
    return this.writeStdout(data + '\n');
  }

  /**
   * Write line to stderr (with newline)
   */
  writeErrorLine(data: string): boolean {
    return this.writeStderr(data + '\n');
  }

  /**
   * Format and write to stdout
   */
  formatWrite(format: string, ...args: any[]): boolean {
    const message = this.formatString(format, ...args);
    return this.writeStdout(message);
  }

  /**
   * Format and write line to stdout
   */
  formatWriteLine(format: string, ...args: any[]): boolean {
    const message = this.formatString(format, ...args);
    return this.writeLine(message);
  }

  // ========== STDIO Event Handling ==========
  
  /**
   * Listen to stdin data events
   */
  onStdinData(callback: (data: Buffer | string) => void): void {
    this.stdin.on('data', callback);
    this.addStdioListener('stdin:data', callback);
  }

  /**
   * Listen to stdin end events
   */
  onStdinEnd(callback: () => void): void {
    this.stdin.on('end', callback);
    this.addStdioListener('stdin:end', callback);
  }

  /**
   * Listen to stdout drain events
   */
  onStdoutDrain(callback: () => void): void {
    this.stdout.on('drain', callback);
    this.addStdioListener('stdout:drain', callback);
  }

  /**
   * Listen to stderr drain events
   */
  onStderrDrain(callback: () => void): void {
    this.stderr.on('drain', callback);
    this.addStdioListener('stderr:drain', callback);
  }

  /**
   * Remove all listeners for a specific event
   */
  removeStdioListeners(event: string): void {
    const listeners = this.stdioListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        // Remove from the actual stream
        switch (event) {
          case 'stdin:data':
            this.stdin.off('data', listener);
            break;
          case 'stdin:end':
            this.stdin.off('end', listener);
            break;
          case 'stdout:drain':
            this.stdout.off('drain', listener);
            break;
          case 'stderr:drain':
            this.stderr.off('drain', listener);
            break;
        }
      });
      this.stdioListeners.delete(event);
    }
  }

  /**
   * Remove all STDIO listeners
   */
  clearStdioListeners(): void {
    for (const [event] of this.stdioListeners) {
      this.removeStdioListeners(event);
    }
    this.stdioListeners.clear();
  }

  // ========== Utility Methods ==========
  
  private addStdioListener(event: string, callback: Function): void {
    if (!this.stdioListeners.has(event)) {
      this.stdioListeners.set(event, []);
    }
    this.stdioListeners.get(event)!.push(callback);
  }

  private formatString(format: string, ...args: any[]): string {
    return format.replace(/{(\d+)}/g, (match, number) => {
      return typeof args[number] !== 'undefined' ? args[number] : match;
    });
  }

  /**
   * Check if stdin is a TTY (interactive terminal)
   */
  isStdinTTY(): boolean {
    return this.stdin.isTTY;
  }

  /**
   * Check if stdout is a TTY
   */
  isStdoutTTY(): boolean {
    return this.stdout.isTTY;
  }

  /**
   * Check if stderr is a TTY
   */
  isStderrTTY(): boolean {
    return this.stderr.isTTY;
  }

  /**
   * Get terminal columns if stdout is TTY
   */
  getTerminalColumns(): number {
    return this.stdout.columns || 80;
  }

  /**
   * Get terminal rows if stdout is TTY
   */
  getTerminalRows(): number {
    return this.stdout.rows || 24;
  }

  // ========== Mock/Test Support ==========
  
  /**
   * Create mock stdin with predefined data
   */
  createMockStdin(data: string | Buffer): Readable {
    const { Readable } = require('stream');
    const mockStdin = new Readable({
      read() {
        this.push(data);
        this.push(null); // EOF
      }
    });
    return mockStdin;
  }

  /**
   * Create mock stdout that collects output
   */
  createMockStdout(): { stream: Writable; getOutput: () => string } {
    const { Writable } = require('stream');
    let output = '';
    const mockStdout = new Writable({
      write(chunk, encoding, callback) {
        output += chunk.toString();
        callback();
      }
    });
    
    return {
      stream: mockStdout,
      getOutput: () => output
    };
  }

  /**
   * Create mock stderr that collects error output
   */
  createMockStderr(): { stream: Writable; getOutput: () => string } {
    const { Writable } = require('stream');
    let output = '';
    const mockStderr = new Writable({
      write(chunk, encoding, callback) {
        output += chunk.toString();
        callback();
      }
    });
    
    return {
      stream: mockStderr,
      getOutput: () => output
    };
  }
}
