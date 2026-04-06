import { stakeholderWsAPI } from "../../api/api";
import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_HTTP } from "./Server_HTTP";
import { WsManager } from "./WsManager";
import { buildUnifiedTestTree } from "../vscode/buildUnifiedTestTree";
import { handleWebSocketMessage } from "../vscode/handleWebSocketMessage";


export class Server_WS extends Server_HTTP {
  protected wsClients: Set<WebSocket> = new Set();
  wsManager: WsManager;

  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
    this.wsManager = new WsManager();
  }

  async start(): Promise<void> {
    await super.start();
  }

  async stop() {
    this.wsClients.forEach((client) => {
      client.close();
    });
    this.wsClients.clear();
    await super.stop();
  }

  escapeXml(unsafe: string): string {
    return this.wsManager.escapeXml(unsafe);
  }

  resourceChanged(url: string) {
    const message = {
      type: stakeholderWsAPI.resourceChanged.type,
      url: url,
      timestamp: new Date().toISOString(),
      message: `Resource at ${url} has been updated`
    };
    this.broadcast(message);
  }

  public broadcast(message: any): void {
    // Validate message type against API definitions
    const validTypes = [
      stakeholderWsAPI.resourceChanged.type,
      stakeholderWsAPI.connected.type,
      stakeholderWsAPI.graphUpdated.type,
    ];

    if (message && typeof message === 'object' && message.type) {
      if (!validTypes.includes(message.type)) {
        console.warn(`Broadcasting message with unknown type: ${message.type}`);
      }
    }

    const data = typeof message === "string" ? message : JSON.stringify(message);
    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private handleWebSocketMessage(ws: WebSocket, message: any): void {
    handleWebSocketMessage(
      ws,
      message,
      this.wsManager,
      () => this.getProcessSummary?.(),
      (processId: string) => {
        const processManager = this as any;
        if (typeof processManager.getProcessLogs === "function") {
          return processManager.getProcessLogs(processId);
        }
        return [];
      },
      (testName: string, hash: string, files: string[], runtime: string) => {
        const sourceFilesUpdated = (this as any).sourceFilesUpdated;
        if (typeof sourceFilesUpdated === 'function') {
          sourceFilesUpdated(testName, hash, files, runtime);
        }
      },
      () => {
        const getBuildListenerState = (this as any).getBuildListenerState;
        if (typeof getBuildListenerState === 'function') {
          return getBuildListenerState();
        }
        return null;
      },
      () => {
        const getBuildEvents = (this as any).getBuildEvents;
        if (typeof getBuildEvents === 'function') {
          return getBuildEvents();
        }
        return [];
      },
      this.broadcast.bind(this)
    );
  }


  private buildUnifiedTestTree(): Record<string, any> {
    return buildUnifiedTestTree(this.configs, process.cwd());
  }

  protected getProcessSummary?(): any;
}
