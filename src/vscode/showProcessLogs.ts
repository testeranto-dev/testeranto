import { ApiUtils } from "./providers/utils/apiUtils";

export const showProcessLogs = () => {
  return vscode.commands.registerCommand(
    "testeranto.showProcessLogs",
    async (processId: string, processName: string) => {
      try {
        // Create output channel for process logs
        const outputChannel = vscode.window.createOutputChannel(`Process: ${processName || processId}`);
        outputChannel.show(true);

        // Fetch logs from server
        const response = await fetch(ApiUtils.getProcessLogsUrl(processId));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        // Use type assertion for the response
        // const processLogsResponse = data as import('../../api').ProcessLogsResponse;

        outputChannel.appendLine(`=== Logs for ${processName || processId} ===`);
        outputChannel.appendLine(`Process ID: ${processId}`);
        // outputChannel.appendLine(`Status: ${processLogsResponse.status || 'unknown'}`);
        // outputChannel.appendLine(`Exit Code: ${processLogsResponse.exitCode || 'N/A'}`);
        // outputChannel.appendLine(`\n--- Logs ---\n`);

        // if (processLogsResponse.logs && Array.isArray(processLogsResponse.logs)) {
        //     processLogsResponse.logs.forEach((log: string) => {
        //         outputChannel.appendLine(log);
        //     });
        // } else {
        //     outputChannel.appendLine('No logs available');
        // }

        outputChannel.appendLine(`\n=== End of logs ===`);
      } catch (err) {
        vscode.window.showErrorMessage(`Error fetching process logs: ${err}`);
      }
    }
  )
}