import { vscodeWsAPI } from '../../api';

export class WsManager {
  escapeXml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  public processMessage(type: string, data: any, getProcessSummary?: () => any, getProcessLogs?: (processId: string) => any[]): any {
    // Check if message type is defined in vscodeWsAPI
    const messageConfig = (vscodeWsAPI as any)[type];
    
    if (!messageConfig) {
      return {
        type: "error",
        message: `Unknown message type: ${type}`,
        timestamp: new Date().toISOString()
      };
    }

    switch (type) {
      case vscodeWsAPI.ping.type:
        return {
          type: vscodeWsAPI.ping.response.type,
          timestamp: new Date().toISOString()
        };
      case vscodeWsAPI.getProcesses.type:
        // According to vscodeWsAPI.getProcesses, this should redirect to HTTP
        return {
          type: vscodeWsAPI.getProcesses.response.type,
          message: "Please use HTTP GET /~/processes to fetch processes",
          timestamp: new Date().toISOString()
        };
      case vscodeWsAPI.getLogs.type:
        const { processId } = data || {};
        if (!processId) {
          return {
            type: vscodeWsAPI.getLogs.response.type,
            status: "error",
            message: "Missing processId",
            timestamp: new Date().toISOString()
          };
        }
        if (getProcessLogs) {
          const logs = getProcessLogs(processId);
          return {
            type: vscodeWsAPI.getLogs.response.type,
            processId,
            logs: logs.map((log: any) => {
              let level = "info";
              let source = "process";
              let message = typeof log === 'string' ? log : JSON.stringify(log);

              if (typeof log === 'string') {
                const match = log.match(/\[(.*?)\] \[(.*?)\] (.*)/);
                if (match) {
                  source = match[2];
                  message = match[3];

                  if (source === "stderr" || source === "error") {
                    level = "error";
                  } else if (source === "warn") {
                    level = "warn";
                  } else if (source === "debug") {
                    level = "debug";
                  } else {
                    level = "info";
                  }
                }
              }

              return {
                timestamp: new Date().toISOString(),
                level: level,
                message: message,
                source: source
              };
            }),
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            type: vscodeWsAPI.getLogs.response.type,
            processId,
            logs: [],
            timestamp: new Date().toISOString()
          };
        }
      case vscodeWsAPI.subscribeToLogs.type:
        const { processId: subProcessId } = data || {};
        if (!subProcessId) {
          return {
            type: vscodeWsAPI.subscribeToLogs.response.type,
            status: "error",
            message: "Missing processId",
            timestamp: new Date().toISOString()
          };
        }
        return {
          type: vscodeWsAPI.subscribeToLogs.response.type,
          status: "subscribed",
          processId: subProcessId,
          timestamp: new Date().toISOString()
        };
      case vscodeWsAPI.sourceFilesUpdated.type:
        const { testName, hash, files, runtime } = data || {};
        if (!testName || !hash || !files || !runtime) {
          return {
            type: vscodeWsAPI.sourceFilesUpdated.type,
            status: "error",
            message: "Missing required fields: testName, hash, files, or runtime",
            timestamp: new Date().toISOString()
          };
        }
        return {
          type: vscodeWsAPI.sourceFilesUpdated.type,
          status: "success",
          testName,
          runtime,
          message: "Build update processed successfully",
          timestamp: new Date().toISOString()
        };
      case vscodeWsAPI.getBuildListenerState.type:
        return {
          type: vscodeWsAPI.getBuildListenerState.response.type,
          status: "error",
          message: "Build listener state not available",
          timestamp: new Date().toISOString()
        };
      case vscodeWsAPI.getBuildEvents.type:
        return {
          type: vscodeWsAPI.getBuildEvents.response.type,
          status: "error",
          message: "Build events not available",
          timestamp: new Date().toISOString()
        };
      default:
        return {
          type: "error",
          message: `Unknown message type: ${type}`,
          timestamp: new Date().toISOString()
        };
    }
  }
}
