import { stakeholderWsAPI } from "../../api";
import type { vscodeWsAPI } from "../../api/vscodeExtensionWs";
import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_HTTP } from "./Server_HTTP";
import { WsManager } from "./WsManager";


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
    if (message.type === vscodeWsAPI.getProcesses.type) {
      this.handleGetProcesses(ws);
      return;
    }

    const response = this.wsManager.processMessage(
      message.type,
      message.data,
      () => this.getProcessSummary?.(),
      (processId: string) => {
        const processManager = this as any;
        if (typeof processManager.getProcessLogs === "function") {
          return processManager.getProcessLogs(processId);
        }
        return [];
      }
    );

    ws.send(JSON.stringify(response));

    switch (message.type) {
      case vscodeWsAPI.sourceFilesUpdated.type:
        this.handleSourceFilesUpdatedSideEffects(ws, message.data, response);
        break;
      case vscodeWsAPI.getBuildListenerState.type:
        this.handleGetBuildListenerStateSideEffects(ws);
        break;
      case vscodeWsAPI.getBuildEvents.type:
        this.handleGetBuildEventsSideEffects(ws);
        break;
    }
  }

  private handleSourceFilesUpdatedSideEffects(ws: WebSocket, data: any, response: any): void {
    const { testName, hash, files, runtime } = data || {};
    if (!testName || !hash || !files || !runtime) {
      return;
    }

    const sourceFilesUpdated = (this as any).sourceFilesUpdated;
    if (typeof sourceFilesUpdated === 'function') {
      sourceFilesUpdated(testName, hash, files, runtime);
      this.broadcast({
        type: vscodeWsAPI.sourceFilesUpdated.type,
        testName,
        hash,
        files,
        runtime,
        status: "processed",
        timestamp: new Date().toISOString(),
        message: "Source files update processed successfully"
      });
    }
  }

  private handleGetBuildListenerStateSideEffects(ws: WebSocket): void {
    const getBuildListenerState = (this as any).getBuildListenerState;
    if (typeof getBuildListenerState === 'function') {
      const state = getBuildListenerState();
      ws.send(JSON.stringify({
        type: vscodeWsAPI.getBuildListenerState.response.type,
        data: state,
        timestamp: new Date().toISOString()
      }));
    }
  }

  private handleGetBuildEventsSideEffects(ws: WebSocket): void {
    const getBuildEvents = (this as any).getBuildEvents;
    if (typeof getBuildEvents === 'function') {
      const events = getBuildEvents();
      ws.send(JSON.stringify({
        type: vscodeWsAPI.getBuildEvents.response.type,
        events: events,
        timestamp: new Date().toISOString()
      }));
    }
  }

  private handleGetProcesses(ws: WebSocket): void {
    if (!ws || typeof ws.send !== 'function') {
      return;
    }
    ws.send(JSON.stringify({
      type: vscodeWsAPI.getProcesses.response.type,
      message: "Please use HTTP GET /~/processes to fetch processes",
      timestamp: new Date().toISOString()
    }));
  }

  protected getProcessSummary?(): any;
}
