import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Captures output from aider processes and processes it for chat
 */
export class AiderOutputCapturer {
  private outputStreams: Map<string, fs.WriteStream> = new Map();
  private chatCallback: (agentName: string, output: string) => void;

  constructor(chatCallback: (agentName: string, output: string) => void) {
    this.chatCallback = chatCallback;
  }

  /**
   * Start capturing output from an aider process
   */
  startCapturing(agentName: string, containerId: string): void {
    // Create a directory for logs if it doesn't exist
    const logDir = path.join(process.cwd(), 'testeranto', 'chat-logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, `${agentName}-${Date.now()}.log`);
    const outputStream = fs.createWriteStream(logFile, { flags: 'a' });
    this.outputStreams.set(agentName, outputStream);

    // Start capturing docker logs
    this.captureDockerLogs(agentName, containerId, outputStream);
  }

  /**
   * Capture docker logs for a container
   */
  private captureDockerLogs(agentName: string, containerId: string, outputStream: fs.WriteStream): void {
    const dockerLogs = spawn('docker', ['logs', '--follow', containerId]);
    
    dockerLogs.stdout.on('data', (data) => {
      const output = data.toString();
      outputStream.write(output);
      this.chatCallback(agentName, output);
    });

    dockerLogs.stderr.on('data', (data) => {
      const output = data.toString();
      outputStream.write(`[STDERR] ${output}`);
      this.chatCallback(agentName, `[ERROR] ${output}`);
    });

    dockerLogs.on('close', (code) => {
      console.log(`[AiderOutputCapturer] Docker logs process for ${agentName} exited with code ${code}`);
      outputStream.end();
      this.outputStreams.delete(agentName);
    });

    dockerLogs.on('error', (err) => {
      console.error(`[AiderOutputCapturer] Error capturing logs for ${agentName}:`, err);
      outputStream.end();
      this.outputStreams.delete(agentName);
    });
  }

  /**
   * Stop capturing output for an agent
   */
  stopCapturing(agentName: string): void {
    const outputStream = this.outputStreams.get(agentName);
    if (outputStream) {
      outputStream.end();
      this.outputStreams.delete(agentName);
    }
  }

  /**
   * Stop capturing all outputs
   */
  stopAll(): void {
    this.outputStreams.forEach((stream, agentName) => {
      stream.end();
    });
    this.outputStreams.clear();
  }
}
