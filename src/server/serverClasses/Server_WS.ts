import { ITestconfigV2 } from "../../Types";
import { WsManager } from "../WsManager";
import { IMode } from "../types";
import { Server_HTTP } from "./Server_HTTP";

export class Server_WS extends Server_HTTP {
  protected wsClients: Set<WebSocket> = new Set();
  wsManager: WsManager;

  constructor(configs: ITestconfigV2, mode: IMode) {
    super(configs, mode);
    this.wsManager = new WsManager();
  }

  async start(): Promise<void> {
    console.log(`[Server_WS] start()`);
    await super.start();
  }

  async stop() {
    console.log(`[Server_WS] stop()`);

    this.wsClients.forEach((client) => {
      client.close();
    });
    this.wsClients.clear();

    await super.stop();
  }

  escapeXml(unsafe: string): string {
    return this.wsManager.escapeXml(unsafe);
  }

  // Notify clients that a resource has changed via WebSocket
  resourceChanged(url: string) {
    console.log(`[WebSocket] Resource changed: ${url}, broadcasting to ${this.wsClients.size} clients`);
    const message = {
      type: "resourceChanged",
      url: url,
      timestamp: new Date().toISOString(),
      message: `Resource at ${url} has been updated`
    };
    console.log(`[WebSocket] Broadcasting message:`, message);
    this.broadcast(message);
  }

  public broadcast(message: any): void {
    const data = typeof message === "string" ? message : JSON.stringify(message);
    console.log(`[WebSocket] Broadcasting to ${this.wsClients.size} clients:`, message.type || message);

    let sentCount = 0;
    let errorCount = 0;
    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
          sentCount++;
        } catch (error) {
          console.error(`[WebSocket] Error sending to client:`, error);
          errorCount++;
        }
      } else {
        console.log(`[WebSocket] Client not open, state: ${client.readyState}`);
      }
    });
    console.log(`[WebSocket] Sent to ${sentCount} clients, ${errorCount} errors`);
  }

  private handleWebSocketMessage(ws: WebSocket, message: any): void {
    console.log("[WebSocket] Received message:", message.type);

    // Handle getProcesses message directly
    if (message.type === "getProcesses") {
      this.handleGetProcesses(ws);
      return;
    }

    // Use WsManager to process the message
    const response = this.wsManager.processMessage(
      message.type,
      message.data,
      () => this.getProcessSummary(),
      (processId: string) => {
        const processManager = this as any;
        if (typeof processManager.getProcessLogs === "function") {
          return processManager.getProcessLogs(processId);
        }
        return [];
      }
    );

    // Send the response
    ws.send(JSON.stringify(response));

    // For certain message types, we need to perform additional server-side actions
    // These are side effects that can't be handled by WsManager alone
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

    console.log(`[WebSocket] Forwarding source files update to build listener for test: ${testName} (runtime: ${runtime})`);

    // Check if this instance has sourceFilesUpdated method (inherited from Server_BuildListener)
    if (typeof (this as any).sourceFilesUpdated === 'function') {
      console.log(`[WebSocket] sourceFilesUpdated method found, calling it`);
      try {
        (this as any).sourceFilesUpdated(testName, hash, files, runtime);
        console.log(`[WebSocket] sourceFilesUpdated called successfully`);

        // Broadcast to all clients
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

        // Update the response if successful
        if (response.status === "success") {
          // Response is already sent, but we can send an additional update
          ws.send(JSON.stringify({
            type: "sourceFilesUpdated",
            status: "processed",
            testName,
            runtime,
            message: "Build update processed and broadcasted successfully",
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error("[WebSocket] Error processing source files update:", error);
        // Send error update
        ws.send(JSON.stringify({
          type: "sourceFilesUpdated",
          status: "error",
          testName,
          runtime,
          message: `Error processing build update: ${error}`,
          timestamp: new Date().toISOString()
        }));
      }
    } else {
      console.warn("[WebSocket] sourceFilesUpdated method not available on this instance");
    }
  }

  private handleGetBuildListenerStateSideEffects(ws: WebSocket): void {
    console.log("[WebSocket] Handling getBuildListenerState request");

    if (typeof (this as any).getBuildListenerState === 'function') {
      try {
        const state = (this as any).getBuildListenerState();
        ws.send(JSON.stringify({
          type: "buildListenerState",
          data: state,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error("[WebSocket] Error getting build listener state:", error);
        ws.send(JSON.stringify({
          type: "buildListenerState",
          status: "error",
          message: `Error getting build listener state: ${error}`,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }

  private handleGetBuildEventsSideEffects(ws: WebSocket): void {
    console.log("[WebSocket] Handling getBuildEvents request");

    if (typeof (this as any).getBuildEvents === 'function') {
      try {
        const events = (this as any).getBuildEvents();
        ws.send(JSON.stringify({
          type: "buildEvents",
          events: events,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error("[WebSocket] Error getting build events:", error);
        ws.send(JSON.stringify({
          type: "buildEvents",
          status: "error",
          message: `Error getting build events: ${error}`,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }

  private handleGetProcesses(ws: WebSocket): void {
    if (!ws || typeof ws.send !== 'function') {
      console.error("[WebSocket] Invalid WebSocket instance in handleGetProcesses");
      return;
    }

    // Don't send processes via WebSocket
    // Instead, send a message telling the client to make an HTTP request
    console.log("[WebSocket] Received getProcesses request, telling client to use HTTP");
    ws.send(JSON.stringify({
      type: "useHttp",
      message: "Please use HTTP GET /~/processes to fetch processes",
      timestamp: new Date().toISOString()
    }));
  }

  protected getProcessSummary?(): any;
}
