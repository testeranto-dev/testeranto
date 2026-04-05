import { jsonResponse } from "../serverClasses/Server_Http/jsonResponse";

// Dynamic handler for process-logs
export const handleProcessLogs = (server: any, processId: string): Response => {
  const getProcessLogs = server.getProcessLogs;
  if (typeof getProcessLogs === "function") {
    const logs = getProcessLogs(processId);
    return jsonResponse({
      logs: logs || [],
      status: "retrieved",
      message: "Success",
    });
  }
  return jsonResponse({
    logs: [],
    status: "not_available",
    message: "Process logs not available",
  });
};
