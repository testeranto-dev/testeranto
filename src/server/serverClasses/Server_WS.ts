import type { ITestconfigV2 } from "../../Types";
import { WsManager } from "./WsManager";
import type { IMode } from "../types";
import { Server_HTTP } from "./Server_HTTP";

export class Server_WS extends Server_HTTP {
  protected wsClients: Set<WebSocket> = new Set();
  wsManager: WsManager;

  constructor(configs: ITestconfigV2, mode: IMode) {
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
      type: "resourceChanged",
      url: url,
      timestamp: new Date().toISOString(),
      message: `Resource at ${url} has been updated`
    };
    this.broadcast(message);
  }

  public broadcast(message: any): void {
    const data = typeof message === "string" ? message : JSON.stringify(message);
    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private handleWebSocketMessage(ws: WebSocket, message: any): void {
    if (message.type === "getProcesses") {
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
      case "sourceFilesUpdated":
        this.handleSourceFilesUpdatedSideEffects(ws, message.data, response);
        break;
      case "getBuildListenerState":
        this.handleGetBuildListenerStateSideEffects(ws);
        break;
      case "getBuildEvents":
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
        type: "sourceFilesUpdated",
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
        type: "buildListenerState",
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
        type: "buildEvents",
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
      type: "useHttp",
      message: "Please use HTTP GET /~/processes to fetch processes",
      timestamp: new Date().toISOString()
    }));
  }

  protected getProcessSummary?(): any;
}
